import fetch from 'node-fetch';
import playwright from 'playwright';
import { chromium } from 'playwright-extra';
import { logger } from '../log/logger.js';
import { Document } from '../document/Document.js';
import { TagRemovingMinimizer } from '../min/TagRemovingMinimizer.js';
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
      p = chromium.connectOverCDP(this.cdp);
    } else {
      logger.debug(`Playwright using local Chromium`);
      p = chromium.launch({ ...this.options, headless: this.headless });
    }

    return p;
  }

  async *_fetch(url, options) {
    logger.info(`Playwright fetch ${url} with options ${options || '(none)'}`);
    if (this.options?.proxy?.server) {
      logger.debug(`Playwright using proxy server ${this.options?.proxy?.server}`);
    }

    const browser = await this.launch();
    const page = await browser.newPage();
    try {
      const gen = this.paginate(url, page, options);
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
    }
  }

  async _docFromPage(page, options) {
    let html;
    let status;
    try {
      logger.debug(`${this} wait for DOM content with timeout ${this.timeoutWait}`)
      await page.waitForLoadState('domcontentloaded', { timeout: this.timeoutWait });
      logger.debug(`${this} loaded page before timeout`);

      if (options?.waitForText) {
        logger.debug(`Wait for text ${options.waitForText}`);
        const locator = page.locator(`text=${options.waitForText}`);
        await locator.waitFor();
      }

      const r = await getHtmlFromSuccess(
        page,
        {
          loadWait: this.loadWait,
          pullIframes: this.pullIframes,
        });
      status = 200;
      html = r.html;
    } catch(e) {
      logger.error(`Playwright could not get ${url}: ${e}`);
      logger.debug(`Trying to salvage results`);
      html = await getHtmlFromError(page);
      if (!html) {
        logger.warn(`Could not salvage results, give up`);
        return;
      }
      logger.warn(`Read ${html.length} bytes from failed Playwright request`);
      status = 500;
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
    await doc.read(resp, url, options);
    return doc;
  }

  async *paginate(url, page, options) {
    // Initial load
    logger.debug(`Playwright go to ${url}`);
    await page.goto(url);
    const doc = await this._docFromPage(page, options);
    logger.info(`${this} yielding first page ${doc}`);
    yield Promise.resolve(doc);

    const iterations = options.pages;
    if (!iterations) {
      logger.info(`${this} not paginating, return`);
      return;
    }

    const min = new TagRemovingMinimizer(['style', 'script', 'meta', 'link']);
    const minDoc = await min.min(doc);
    const chunks = minDoc.htmlChunks(this.ai.maxTokens);
    const fns = [];

    for (const html of chunks) {
      const prompt = analyzePagination.render({ html });
      const answer = await this.ai.ask(prompt, { format: 'json' });
      logger.debug(`${this} got pagination answer: ${JSON.stringify(answer.partial, null, 2)}`);
      if (answer.partial.hasPagination &&
        answer.partial.paginationJavascript
      ) {
        fns.push(new Function(answer.partial.paginationJavascript));
      }
    }

    if (!fns.length) {
      logger.warn(`${this} didn't find a way to paginate, bailing`);
      return;
    }

    // TODO: pick the best one?
    let fnIndex = 0;

    // Start on i = 1 to account for first page already yielded
    for (let i = 1; i < iterations; i++) {
      const fn = fns[fnIndex];
      logger.debug(`${this} running ${fn} on pagination iteration #${i}`);
      let done
      try {
        done = await page.evaluate(fn);
      } catch (e) {
        if (fnIndex >= fns.length) {
          logger.warn(`${this} got pagination error on iteration #${i}, bailing: ${e}`);
          break;
        }

        fnIndex++;
        logger.warn(`${this} got pagination error on iteration #${i} with ${fn}, trying next pagination function: ${e}`);
        continue;
      }

      // TODO: intelligent wait for pagination completion
      logger.debug(`${this} waiting ${this.loadWait} msec for pagination #${i}, got done=${done}`);
      await new Promise(ok => setTimeout(ok, this.loadWait));

      const doc = await this._docFromPage(page, options);
      logger.info(`${this} yielding page #${i} ${doc}`);
      yield Promise.resolve(doc);

      if (done) break;
    }
  }
}

const getHtmlFromSuccess = async (page, { loadWait, pullIframes }) => {
  logger.debug(`Playwright waiting ${(loadWait/1000).toFixed(1)} sec`);
  await new Promise(ok => setTimeout(ok, loadWait));

  if (pullIframes) {
    // Get all the iframes
    logger.debug(`Get iframes on ${page.url()}`);
    const frames = await page.frames();
    const iframes = [];
    for (const frame of frames) {
      let el;
      try {
        el = await frame.frameElement();
      } catch(e) {
        continue;
      }
      const tagName = await el.evaluate(el => el.tagName);
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

      const result = await page.evaluate(({ index, content }) => {
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
    }
  }

  logger.debug(`Get page content on ${page.url()}`);
  const start = (new Date()).getTime();
  const html = await page.content();
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
