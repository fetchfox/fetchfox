import { chromium } from 'playwright-extra';
import { Document } from '../document/Document.js';
import { logger } from '../log/logger.js';
import { TagRemovingMinimizer } from '../min/TagRemovingMinimizer.js';
import { createChannel, Timer } from '../util.js';
import { BaseFetcher } from './BaseFetcher.js';
import { analyzePagination } from './prompts.js';

export const PlaywrightFetcher = class extends BaseFetcher {
  constructor(options) {
    super(options);
    this.headless = options.headless === undefined ? true : options.headless;
    this.browser = options.browser || 'chromium';
    this.cdp = options.cdp;

    // TODO: these options should be passed in in `fetch`
    this.loadWait = options.loadWait || 4000;
    this.timeoutWait = options.timeoutWait || 15000;
    this.pullIframes = options.pullIframes;

    this.options = options.options || {};
    this.timer = new Timer({ name: 'PlaywrightFetcher' });
  }

  cacheOptions() {
    return {
      browser: 'chromium',
      loadWait: this.loadWait,
      timeoutWait: this.timeoutWait,
      waitForText: this.waitForText,
    };
  }

  async launch() {
    logger.debug(`Playwright launching...`);

    let p;
    if (this.cdp) {
      logger.debug(`Playwright using CDP endpoint ${this.cdp}`);

      for (let i = 0; i < 3; i++) {
        try {
          p = chromium.connectOverCDP(this.cdp);
          break;
        } catch (e) {
          logger.warn(`Could not connect to CDP: ${e}`);
          await new Promise((ok) => setTimeout(ok, 5 * 1000));
        }

        if (!p) {
          throw new Error('Could not connet to CDP, giving up');
        }
      }
    } else {
      logger.debug(`Playwright using local Chromium`);
      p = chromium.launch({ ...this.options, headless: this.headless });
    }

    return p;
  }

  async *_fetch(url, options) {
    yield* this.timer.withScopeGen('fetch', this, async function* (timer) {
      logger.info(`${this} Fetch ${url} with options ${options || '(none)'}`);
      if (this.options?.proxy?.server) {
        logger.debug(`Playwright using proxy server ${this.options?.proxy?.server}`);
      }

      timer.log('log stuff out');

      const browser = await this.launch();

      timer.log('launch browser');

      logger.debug(`${this} got browser`);

      const page = await browser.newPage();

      timer.log('browser.newPage()');

      try {
        const gen = this.paginate(url, page, options);

        timer.log('paginate');

        for await (const doc of gen) {
          timer.log('found something');
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
      }
    });
  }

  async _docFromPage(page, options) {
    return await this.timer.withScope('docFromPage', async (timer) => {
      let html;
      let status;
      try {
        logger.debug(`${this} wait for DOM content with timeout ${this.timeoutWait}`);
        await page.waitForLoadState('domcontentloaded', {
          timeout: this.timeoutWait,
        });

        timer.log('wait for dom content loaded');
        logger.debug(`${this} loaded page before timeout`);

        if (options?.waitForText) {
          logger.debug(`Wait for text ${options.waitForText}`);
          const locator = page.locator(`text=${options.waitForText}`);
          await locator.waitFor();
        }

        timer.log('wait for text');

        const r = await getHtmlFromSuccess(page, {
          loadWait: 0, // this.loadWait,
          pullIframes: this.pullIframes,
          timer: this.timer,
        });

        timer.log('get html from success');

        status = 200;
        html = r.html;
      } catch (e) {
        logger.error(`Playwright could not get from ${page}: ${e}`);
        logger.debug(`Trying to salvage results`);
        html = await getHtmlFromError(page);
        if (!html) {
          logger.warn(`Could not salvage results, give up`);
          return;
        }
        logger.warn(`Read ${html.length} bytes from failed Playwright request`);
        status = 500;
      }

      timer.log('finish try/catch block');

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
      await doc.read(resp, url, options);

      timer.log('read document');

      return doc;
    });
  }

  async *paginate(url, page, options) {
    yield* this.timer.withScopeGen('paginate', this, async function* (timer) {
      // Initial load
      try {
        await page.goto(url); // , { waitUntil: "domcontentloaded" });
      } catch (e) {
        logger.warn(`Goto gave error, but continuing anyways: ${e}`);
      }

      timer.log('goto url');

      const doc = await this._docFromPage(page, options);
      timer.log('_docFromPage');

      if (!doc) {
        logger.warn(`${this} could not get document for ${url}, bailing on pagination`);
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
        const minDoc = await min.min(doc);
        const fns = [];

        timer.log('TagRemovingMinimizer');

        const hostname = new URL(url).hostname;
        let domainSpecific =
          {
            'x.com':
              'You are on x.com, which paginates by scrolling down exactly one window length. Your pagination should do this.',
          }[hostname] || '';

        if (domainSpecific) {
          domainSpecific = '>>>> Follow this important domain specific guidance:\n\n' + domainSpecific;
          logger.debug(`${this} adding domain specific prompt: ${domainSpecific}`);
        }

        timer.log('domain stuff');

        const context = {
          html: minDoc.html,
          domainSpecific,
        };
        const prompts = await analyzePagination.renderMulti(context, 'html', this.ai, this.cache);

        timer.log('analyzePagination.renderMulti');

        logger.debug(`${this} analyze chunks for pagination (${prompts.length})`);
        for (const prompt of prompts) {
          let answer;
          try {
            answer = await this.ai.ask(prompt, { format: 'json' });
          } catch (e) {
            logger.error(`${this} Got AI error during pagination, ignore`);
            continue;
          }

          timer.log(`paginate prompt: ${prompt.slice(0, 100)}`);

          logger.debug(`${this} Got pagination answer: ${JSON.stringify(answer.partial, null, 2)}`);

          if (answer?.partial?.hasPagination && answer?.partial?.paginationJavascript) {
            let fn;
            try {
              fn = new Function(answer.partial.paginationJavascript);
            } catch (e) {
              logger.warn(
                `${this} Got invalid pagination function ${answer.partial.paginationJavascript}, dropping it`,
              );
            }
            if (fn) {
              fns.push(fn);
            }
          }

          timer.log('some other weird shit');
        }

        if (!fns.length) {
          logger.warn(`${this} Didn't find a way to paginate, bailing`);
          channel.end();
          return;
        }

        timer.log(`right before iterations`);

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
            logger.warn(
              `${this} got pagination error on iteration #${i} with ${fn}, trying next pagination function: ${e}`,
            );
            continue;
          }
          const doc = await this._docFromPage(page, options);

          logger.info(`${this} got pagination doc ${doc} on iteration ${i}`);
          if (doc) {
            channel.send({ doc });
          }

          timer.log(`iteration ${i}`);
        }

        channel.end();
      })();

      logger.info(`${this} yielding first page ${doc}`);
      yield Promise.resolve(doc);

      for await (const val of channel.receive()) {
        if (val.end) break;
        yield Promise.resolve(val.doc);
      }
    });
  }
};

const getHtmlFromSuccess = async (page, { loadWait, pullIframes, timer }) => {
  return await timer.withScope('getHtmlFromSuccess', async (timer) => {
    logger.debug(`Playwright waiting ${(loadWait / 1000).toFixed(1)} sec`);

    await new Promise((ok) => setTimeout(ok, loadWait));

    timer.log(`waiting loadWait ${loadWait}`);

    if (pullIframes) {
      // Get all the iframes
      logger.debug(`Get iframes on ${page.url()}`);
      const frames = await page.frames();
      const iframes = [];
      for (const frame of frames) {
        let el;
        try {
          el = await frame.frameElement();
        } catch (e) {
          continue;
        }
        const tagName = await el.evaluate((el) => el.tagName);
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
        } catch (e) {
          content = '[iframe unavailable]';
        }

        const result = await page.evaluate(
          ({ index, content }) => {
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
          },
          { index: i, content },
        );
      }

      timer.log('pull iframes');
    }

    logger.debug(`Get page content on ${page.url()}`);
    const start = new Date().getTime();
    const html = await page.content();
    const took = new Date().getTime() - start;
    logger.debug(`Running .content() took ${took} msec`);

    timer.log('page.content()');

    return { html };
  });
};

const getHtmlFromError = async (page) => {
  try {
    logger.debug(`Get HTML from error result on ${page.url()}`);
    const html = await page.evaluate(() => document.documentElement.outerHTML);
    return html;
  } catch (e) {
    logger.error(`Failed to get HTML from error result, got another error: ${e}`);
    return null;
  }
};
