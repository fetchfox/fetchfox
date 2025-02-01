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

  async finishGoto() {
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
          promise = chromium.launch({ ...this.options, headless: this.headless });
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

  async execute(instr) {
    logger.info(`${this} Execute instructions: ${instr.url} ${instr.learned}`);

    const indexes = new Array(instr.learned.length).fill(0);

    let ctx = {};
    await this.start(ctx);
    ctx = { ...ctx, ...(await this.goto(instr.url, ctx)) };

    let i = 0;
    const docs = [];

    let done = false;
    while (!done) {
      logger.debug(`${this} Execute instructions, iterate i=${i}, indexes=${indexes}`);

      const action = instr.learned[i];
      const success = await this.act(ctx, action, indexes[i]);

      if (success) {
        const isLast = i == instr.learned.length - 1;
        if (isLast) {
          indexes[i]++;
          const doc = await this._docFromPage(ctx.page, ctx.timer);
          logger.info(`${this} Executing instructions found: ${doc}`);
          docs.push(doc);
        } else {
          i++;
        }
      }

      if (!success) {
        if (i == 0) {
          // End condition: we failed on the first action
          done = true;
        } else {
          indexes[i - 1]++;
          for (let j = i; j < instr.learned.length; j++) {
            indexes[j] = 0;
          }
          i = 0;
        }
      }
    }

    await this.finish(ctx);

    return docs;
  }

  async act(ctx, action, index) {
    logger.debug(`${this} Do action: ${JSON.stringify(action)} index=${index}`);

    switch (action.type) {
      case 'click':
        return await this.click(ctx, action.arg, index);

      default:
        throw new Error(`Unhandled action type: ${action.type}`);
    }
  }

  async click(ctx, selector, index) {
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

  async scroll(type, ctx) {
    switch (type) {
      case 'window':
        return ctx.page.keyboard.press('PageDown');
      case 'bottom':
        /* eslint-disable no-undef */
        return ctx.page.evaluate(() => window.scrollBy(0, window.innerHeight));
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
