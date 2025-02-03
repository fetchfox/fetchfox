import { chromium } from 'playwright-extra';
import { Timer } from '../log/timer.js';
import { logger } from '../log/logger.js';
import { Document } from '../document/Document.js';
import { BaseFetcher } from './BaseFetcher.js';
import { abortable } from '../util.js';

process.on('unhandledRejection', (e) => {
  if (e.name == 'TargetClosedError') {
    // These exceptions occur sometimes on browser launch, and we cannot
    // catch them in this as they happen.
    logger.error(`Ignore unhandled rejection: ${e}`);
  } else {
    throw e;
  }
});


export const PlaywrightFetcher = class extends BaseFetcher {
  constructor(options) {
    super(options);
    this.headless = options?.headless === undefined ? true : options?.headless;
    this.browser = options?.browser || 'chromium';
    this.cdp = options?.cdp;
    this.pullIframes = options?.pullIframes;
  }

  cacheOptions() {
    return {
      browser: 'chromium',
      loadWait: this.loadWait,
      waitForText: this.waitForText,
    };
  }

  async goto(url, ctx) {
    const page = await ctx.browser.newPage();

    try {
      const { aborted } = await abortable(
        this.signal,
        page.goto(url, { waitUntil: 'domcontentloaded' }));
      if (aborted) {
        logger.warn(`${this} Aborted on goto`);
        return;
      }
    } catch (e) {
      logger.warn(`${this} Goto gave error, but continuing anyways: ${e}`);
    }

    return { page };
  }

  async finishGoto(ctx) {
    return ctx.page && ctx.page.close();
  }

  async current(ctx) {
    let doc;
    let aborted;
    try {
      const result = await abortable(this.signal, this._docFromPage(ctx.page, ctx.timer));
      aborted = result.aborted;
      doc = result.result;
    } catch (e) {
      logger.error(`${this} Error while getting current doc: ${e}`);
      return;
    }
    if (aborted) {
      logger.warn(`${this} Aborted while getting current doc`);
      return;
    }
    return doc;
  }


  async _launch() {
    logger.debug(`Playwright launching...`);

    let err;
    let i;
    for (i = 0; i < 3; i++) {
      try {
        let promise;
        if (this.cdp) {
          logger.debug(`Playwright using CDP endpoint ${this.cdp}, attempt=${i}`);
          promise = chromium.connectOverCDP(this.cdp);
        } else {
          logger.debug(`Playwright using local Chromium, attempt=${i}`);
          promise = chromium.launch({ headless: this.headless });
        }
        const browser = await promise;
        return browser;
      } catch (e) {
        logger.warn(`${this} Could not launch, retrying, attempt=${i}: ${e}`);
        err = e;
        await new Promise(ok => setTimeout(ok, i * 4000));
      }
    }

    logger.warn(`${this} Could not launch, throwing, attempt=${i}: ${err}`);
    throw err;
  }

  async start(ctx) {
    const timer = ctx.timer || new Timer();

    try {
      ctx.browser = await this._launch({ timer });
    } catch (e) {
      logger.error(`${this} Caught error while launching browser: ${e}`);
      throw e;
    }

    logger.debug(`${this} Got browser`);
  }

  async finish(ctx) {
    if (ctx.browser) {
      logger.debug(`${this} Closing browser`);
      await ctx.browser.close();
    }
  }

  async act(ctx, action, index) {
    logger.trace(`${this} Do action: ${JSON.stringify(action)} index=${index}`);

    let ok;

    switch (action.type) {
      case 'click':
        ok = await this.click(ctx, action.arg, index);
        break;

      case 'scroll':
        ok = await this.scroll(ctx, action.arg, index);
        break;

      default:
        throw new Error(`Unhandled action type: ${action.type}`);
    }

    logger.debug(`${this} Action wait ${(this.actionWait / 1000).toFixed(1)} sec`);
    ok && await new Promise(ok_ => setTimeout(ok_, this.actionWait));

    return ok;
  }

  async click(ctx, selector, index) {
    logger.debug(`${this} Click selector=${selector} index=${index}`);

    if (!selector.startsWith('text=') && !selector.startsWith('css=')) {
      logger.warn(`{this} Invalid selector: ${selector}`);
      return false;
    }
    const loc = ctx.page.locator(selector);
    if (await loc.count() <= index) {
      if (index == 0) {
        logger.warn(`${this} Couldn't find selector=${selector} index=${index}, not clicking`);
      }
      return false;
    }

    const el = loc.nth(index);
    await el.scrollIntoViewIfNeeded();
    await el.click();
    return true;
  }

  async evaluate() {
    throw new Error('TODO');
  }

  async scroll(ctx, type) {
    logger.debug(`${this} Scroll type=${type}`);

    // TODO: Check if scrolling worked

    switch (type) {
      case 'window':
        await ctx.page.keyboard.press('PageDown');
        return true;
      case 'bottom':
        /* eslint-disable no-undef */
        await ctx.page.evaluate(async () => {
          const scrollToBottom = async () => {
            const top = document.documentElement.scrollHeight;
            console.log('scrollToBottom got top:', top);
            return new Promise((ok) => {
              console.log('inside promise');
              const fn = () => {
                console.log('scrollend cb');
                document.removeEventListener('scrollend', fn);
                ok();
              }
              document.addEventListener('scrollend', fn);
              window.scrollTo({ top, behavior: 'smooth' });
            });
          }

          console.log('start scrollToBottom');
          await scrollToBottom();
        });
        return true;
        /* eslint-enable no-undef */
      default:
        logger.error(`${this} Unhandled scroll type: ${type}`);
    }
  }

  async _docFromPage(page, timer) {
    timer ||= new Timer();

    let html;
    let status;

    timer.push('PlaywrightFetcher _docFromPage');
    try {
      const result = await abortable(
        this.signal,
        getHtmlFromSuccess(
          page,
          {
            loadWait: this.loadWait,
            pullIframes: this.pullIframes,
          }));

      if (result.aborted) {
        return;
      }
      status = 200;
      html = result.result.html;
    } catch(e) {

      logger.error(`Playwright could not get from ${page.url()}: ${e}`);
      logger.debug(`Trying to salvage results`);

      try {
        const result = await abortable(this.signal, getHtmlFromError(page));
        if (result.aborted) {
          return;
        }
        html = result.result.html;

      } catch (e) {
        logger.warn(`Could not salvage results, give up: ${e}`);
        return;
      }
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
      await doc.read(resp, url, { timer });
    } catch (e) {
      logger.error(`${this} Error while reading document: ${e}`);
      return;
    }

    return doc;
  }
}

const getHtmlFromSuccess = async (page, { loadWait, pullIframes }) => {
  logger.debug(`Load waiting ${(loadWait / 1000).toFixed(1)} sec`);
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
      } catch {
        continue;
      }
      let tagName;
      try {
        tagName = await el.evaluate(el => el.tagName);
      } catch {
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
      } catch {
        content = '[iframe unavailable]';
      }

      // Turn off linter for undefined variables because this code
      // runs in Playwright's browser context, and has document and
      // window available without declaration.
      /* eslint-disable no-undef */
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
      /* eslint-enable no-undef */

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
    logger.error(`Error getting page content: ${e}`);
    throw e;
  }
  const took = (new Date()).getTime() - start;
  logger.debug(`Running .content() took ${took} msec`);

  return { html };
}

const getHtmlFromError = async (page) => {
  // Disable undefined variable linting for document variables
  // which is available in Playwright's browser context.
  /* eslint-disable no-undef */
  try {
    logger.debug(`Get HTML from error result on ${page.url()}`);
    const html = await page.evaluate(() => document.documentElement.outerHTML);
    return html
  } catch(e) {
    logger.error(`Failed to get HTML from error result, got another error: ${e}`);
    return null;
  }
  /* eslint-enable no-undef */
}
