import fetch from 'node-fetch';
import playwright from 'playwright';
import { chromium } from 'playwright-extra';
import { Timer } from '../log/timer.js';
import { logger } from '../log/logger.js';
import { Document } from '../document/Document.js';
import { TagRemovingMinimizer } from '../min/TagRemovingMinimizer.js';
import { BaseFetcher } from './BaseFetcher.js';
import { analyzePagination } from './prompts.js';
import { createChannel } from '../util.js';

export const PlaywrightFetcher = class extends BaseFetcher {
  constructor(options) {
    super(options);
    this.headless = options?.headless === undefined ? true : options?.headless;
    this.browser = options?.browser || 'chromium';
    this.cdp = options?.cdp;

    // TODO: these options should be passed in in `fetch`
    this.loadWait = options?.loadWait || 4000;
    this.timeoutWait = options?.timeoutWait || 15000;
    this.pullIframes = options?.pullIframes;

    this.options = options?.options || {};
  }

  cacheOptions() {
    return {
      browser: 'chromium',
      loadWait: this.loadWait,
      timeoutWait: this.timeoutWait,
      waitForText: this.waitForText,
    };
  }

  async launch(options) {
    const timer = options?.timer || new Timer();
    timer.push('PlaywrightFetcher.launch');

    logger.debug(`Playwright launching...`);

    let p;
    if (this.cdp) {
      logger.debug(`Playwright using CDP endpoint ${this.cdp}`);

      for (let i = 0; i < 3; i++) {
        try {
          p = chromium.connectOverCDP(this.cdp);
          break;
        } catch(e) {
          logger.warn(`Could not connect to CDP: ${e}`);
          await new Promise(ok => setTimeout(ok, 5 * 1000));
        }

        if (!p) {
          throw new Error('Could not connet to CDP, giving up');
        }
      }
    } else {
      logger.debug(`Playwright using local Chromium`);
      p = chromium.launch({ ...this.options, headless: this.headless });
    }

    timer.pop();

    return p;
  }

  async *_fetch(url, options) {
    const timer = new Timer();
    timer.push('PlaywrightFetcher._fetch');

    logger.info(`${this} Fetch ${url} with options ${options || '(none)'}`);
    if (this.options?.proxy?.server) {
      logger.debug(`Playwright using proxy server ${this.options?.proxy?.server}`);
    }

    let browser;
    try {
      browser = await this.launch({ timer });
    } catch (e) {
      logger.error(`${this} Caught error while launching browser: ${e}`);
      throw e;
    }
    logger.debug(`${this} got browser`);

    timer.push('PlaywrightFetcher browser.newPage');
    let page;
    try {
      page = await browser.newPage();
    } catch(e) {
      logger.error(`${this} Caught error while opening new page: ${e}`);
      throw e;
    } finally {
      timer.pop();
    }

    try {
      const gen = this.paginate(url, page, { ...options, timer });
      for await (const doc of gen) {
        yield Promise.resolve(doc);
      }
    } catch (e) {
      logger.error(`Playwright error: ${e}`);
      throw e;
    } finally {
      if (browser) {
        logger.debug(`Closing on ${url}`);
        await browser.close();
      }
      timer.pop();
    }
  }

  async _docFromPage(page, options) {
    const timer = options?.timer || new Timer();

    let html;
    let status;

    timer.push('PlaywrightFetcher _docFromPage');
    try {
      const r = await getHtmlFromSuccess(
        page,
        {
          loadWait: this.loadWait,
          pullIframes: this.pullIframes,
        });
      status = 200;
      html = r.html;
    } catch(e) {
      if (this.signal?.aborted) {
        return;
      }

      logger.error(`Playwright could not get from ${page}: ${e}`);
      logger.debug(`Trying to salvage results`);
      html = await getHtmlFromError(page);
      if (!html) {
        logger.warn(`Could not salvage results, give up`);
        return;
      }
      logger.warn(`Read ${html.length} bytes from failed Playwright request`);
      status = 500;
    } finally {
      timer.pop();
    }

    const url = page.url();
    const resp = {
      status: () => status,
      url: () => url,
      body: () => html,
      html: () => html,
      text: () => html,
      headers: {
        'content-type': 'text/html',
      },
    };

    const doc = new Document();
    try {
      await doc.read(resp, url, { ...options, timer });
    } catch (e) {
      logger.error(`${this} Error while reading document: ${e}`);
      return;
    }

    return doc;
  }

  async _abortable(promise) {
    const resultPromise = new Promise(async (ok, bad) => {
      let result;
      try {
        result = await promise;
      } catch (e) {
        if (this.signal.aborted) {
          ok({ aborted: true });
          return;
        }

        logger.error(`${this} Abortable got error: ${e}`);
        bad(e);
      }

      ok({ aborted: false, result });
    });

    if (!this.signal) {
      return resultPromise;
    }

    let abortListener;
    const signalPromise = new Promise((ok) => {
      if (this.signal.aborted) {
        logger.debug(`${this} Already aborted`);
        ok({ aborted: true });
        return;
      }

      abortListener = () => {
        logger.debug(`${this} Got abort signal`);
        ok({ aborted: true });
      }
      this.signal.addEventListener('abort', abortListener);
    });

    try {
      const result = await Promise.race([
        resultPromise,
        signalPromise,
      ]);
      return result;
    } finally {
      this.signal.removeEventListener('abort', abortListener);
    }
  }

  async *paginate(url, page, options) {
    const timer = options?.timer || new Timer();

    try {
      const { aborted } = await this._abortable(page.goto(url, { waitUntil: 'domcontentloaded' }));
      if (aborted) {
        logger.warn(`${this} Aborted on goto`);
        return;
      }
    } catch (e) {
      logger.warn(`${this} Goto gave error, but continuing anyways: ${e}`);
    }

    let doc;
    let aborted;
    try {
      const result = await this._abortable(this._docFromPage(page, options));
      aborted = result.aborted;
      doc = result.result;
    } catch (e) {
      logger.error(`${this} Error while getting doc from page: ${e}`);
      return;
    }

    if (!doc) {
      logger.warn(`${this} could not get document for ${url}, bailing on pagination`);
      return;
    }
    if (aborted) {
      logger.warn(`${this} Aborted on _docFromPage`);
      return;
    }

    const iterations = options?.maxPages || 0;

    // Kick off job for pages 2+
    const channel = createChannel();
    (async () => {
      if (!iterations || iterations == 1) {
        logger.info(`${this} Not paginating, return`);
        channel.end();
        return;
      }

      const min = new TagRemovingMinimizer(['style', 'script', 'meta', 'link']);
      const minDoc = await min.min(doc, { timer });
      const fns = [];

      const hostname = (new URL(url)).hostname;
      let domainSpecific = {
        'x.com': 'You are on x.com, which paginates by scrolling down exactly one window length. Your pagination should do this.'
      }[hostname] || '';
      if (domainSpecific) {
        domainSpecific = '>>>> Follow this important domain specific guidance:\n\n' + domainSpecific;
        logger.debug(`${this} adding domain specific prompt: ${domainSpecific}`);
      }
      const context = {
        html: minDoc.html,
        domainSpecific,
      };

      try {
        const prompts = await analyzePagination.renderMulti(context, 'html', this.ai);
      } catch (e) {
        logger.error(`${this} Error while rendering prompts: ${e}`);
        return;
      }

      logger.debug(`${this} analyze chunks for pagination (${prompts.length})`);
      for (const prompt of prompts) {
        let answer;
        try {
          answer = await this.ai.ask(prompt, { format: 'json' });
        } catch(e) {
          logger.error(`${this} Got AI error during pagination, ignore`);
          continue
        }

        logger.debug(`${this} Got pagination answer: ${JSON.stringify(answer.partial, null, 2)}`);

        if (answer?.partial?.hasPagination &&
          answer?.partial?.paginationJavascript
        ) {
          let fn;
          try {
            fn = new Function(answer.partial.paginationJavascript);
          } catch(e) {
            logger.warn(`${this} Got invalid pagination function ${answer.partial.paginationJavascript}, dropping it`);
          }
          if (fn) {
            fns.push(fn);
          }
        }
      }

      if (!fns.length) {
        logger.warn(`${this} Didn't find a way to paginate, bailing`);
        channel.end();
        return;
      }

      const docs = [];
      let fnIndex = 0;
      for (let i = 1; i < iterations; i++) {
        const fn = fns[fnIndex];
        logger.debug(`${this} Running ${fn} on pagination iteration #${i}`);
        try {
          await page.evaluate(fn);
        } catch (e) {
          if (fnIndex >= fns.length) {
            logger.warn(`${this} got pagination error on iteration #${i}, bailing: ${e}`);
            break;
          }

          fnIndex++;
          logger.warn(`${this} got pagination error on iteration #${i} with ${fn}, trying next pagination function: ${e}`);
          continue;
        }

        let doc;
        let aborted;
        try {
          const result = await this._abortable(this._docFromPage(page, options));
          aborted = result.aborted;
          doc = result.result;
        } catch (e) {
          logger.error(`${this} Error while getting docs from page: ${e}`);
          throw e;
        }
        if (aborted) {
          logger.warn(`${this} Aborted on _docFromPage during pagination`);
          break;
        }

        logger.info(`${this} got pagination doc ${doc} on iteration ${i}`);
        if (doc) {
          channel.send({ doc });
        }
      }

      channel.end();
    })();

    logger.info(`${this} yielding first page ${doc}`);
    yield Promise.resolve(doc);

    try {
      for await (const val of channel.receive()) {
        if (val.end) {
          break;
        }
        yield Promise.resolve(val.doc);
      }
    } catch (e) {
      logger.error(`${this} Error while reading docs channel in pagination: ${e}`);
      throw e;
    }
  }
}

const getHtmlFromSuccess = async (page, { loadWait, pullIframes }) => {
  logger.debug(`Playwright waiting ${(loadWait/1000).toFixed(1)} sec`);
  await new Promise(ok => setTimeout(ok, loadWait));

  if (pullIframes) {
    // Get all the iframes
    logger.debug(`Get iframes on ${page.url()}`);
    let frames;
    try {
      frames = await page.frames();
    } catch (e) {
      logger.error(`${this} Error while getting frames: ${e}`);
      throw e;
    }
    const iframes = [];
    for (const frame of frames) {
      let el;
      try {
        el = await frame.frameElement();
      } catch(e) {
        continue;
      }
      let tagName;
      try {
        tagName = await el.evaluate(el => el.tagName);
      } catch (e) {
        continue;
      }
      if (tagName == 'IFRAME') {
        iframes.push(frame);
      }
    }

    // Get the HTML inside each iframe, and insert it into the page
    logger.debug(`Get HTML inside iframes on ${page.url()}`);
    for (let i = 0; i < iframes.length; i++) {
      const iframe = iframes[i];
      let content;
      try {
        content = await iframe.content();
      } catch(e) {
        content = '[iframe unavailable]';
      }

      const evalPromise = page.evaluate(({ index, content }) => {
        const iframes = document.querySelectorAll('iframe');
        const iframe = iframes[index];
        if (iframe) {
          let policy;
          if (window.trustedTypes.defaultPolicy) {
            policy = window.trustedTypes.defaultPolicy;
          } else {
            policy = window.trustedTypes.createPolicy('default', {
              createHTML: (html) => html,
            });
          }

          const div = document.createElement('div');
          div.innerHTML = policy.createHTML(content);

          iframe.replaceWith(div);
        }
      }, { index: i, content });

      try {
        await evalPromise;
      } catch (e) {
        logger.warn(`${this} Error while updating trusted policy, ignoring: ${e}`);
      }
    }
  }

  logger.debug(`Get page content on ${page.url()}`);
  const start = (new Date()).getTime();
  let html;
  try {
    html = await page.content();
  } catch (e) {
    logger.error(`${this} Error getting page content: ${e}`);
    throw e;
  }
  const took = (new Date()).getTime() - start;
  logger.debug(`Running .content() took ${took} msec`);

  return { html };
}

const getHtmlFromError = async (page) => {
  try {
    logger.debug(`Get HTML from error result on ${page.url()}`);
    const html = await page.evaluate(() => document.documentElement.outerHTML);
    return html
  } catch(e) {
    logger.error(`Failed to get HTML from error result, got another error: ${e}`);
    return null;
  }
}
