import fetch from 'node-fetch';
import playwright from 'playwright';
import { chromium } from 'playwright-extra';
import { logger } from '../log/logger.js';
import { Document } from '../document/Document.js';
import { BaseFetcher } from './BaseFetcher.js';

export const PlaywrightFetcher = class extends BaseFetcher {
  constructor(options) {
    super(options);
    this.headless = options.headless === undefined ? true : options.headless;
    this.browser = options.browser || 'chromium';
    this.loadWait = options.loadWait || 1000;
    this.waitForLocator = options.waitForLocator;
    this.timeoutWait = options.timeoutWait || 15000;
    this.pullIframes = options.pullIframes;
    this.cdp = options.cdp;

    this.options = options.options || {};
  }

  cacheOptions() {
    return {
      browser: 'chromium',
      loadWait: this.loadWait,
      waitForLocator: this.waitForLocator,
      timeoutWait: this.timeoutWait,
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

    const doc = new Document();

    let browser;
    try {
      browser = await this.launch();
      const page = await browser.newPage();
      let resp;
      let html;
      try {
        logger.debug(`Playwright go to ${url} with timeout ${this.timeoutWait}`);
        resp = await page.goto(
          url,
          {
            timeout: this.timeoutWait,
            // waitUntil: 'domcontentloaded',
          });

        if (this.waitForLocator) {
          logger.debug(`Wait for locator ${this.waitForLocator}`);
          const locator = page.locator(this.waitForLocator);
          await locator.waitFor();
        }

        logger.debug(`Playwright loaded page before timeout`);
        const r = await getHtmlFromSuccess(
          page, {
            loadWait: this.loadWait,
            pullIframes: this.pullIframes,
          });
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

        resp = {
          status: () => 500,
          url: () => url,
          body: () => html,
          html: () => html,
          text: () => html,
          headers: {
            'content-type': 'text/html',
          },
        };
      }

      resp.text = () => html;
      const doc = new Document();
      await doc.read(resp, url, options);

      logger.info(`Playwright returning: ${doc}`);

      yield Promise.resolve(doc);
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
