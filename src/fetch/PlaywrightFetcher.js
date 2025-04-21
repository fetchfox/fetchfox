import pTimeout from 'p-timeout';
import { chromium } from 'playwright-extra';
import { Timer } from '../log/timer.js';
import { logger as defaultLogger } from '../log/logger.js';
import { getKV } from '../kv/index.js';
import { Document } from '../document/Document.js';
import { BaseFetcher } from './BaseFetcher.js';
import { abortable, srid } from '../util.js';
import { putS3, urlForKey } from './util.js';

process.on('unhandledRejection', (e) => {
  if (e.ignore) {
    return;
  }

  if (e.name == 'TargetClosedError') {
    // These exceptions occur sometimes on browser launch, and we cannot
    // catch them in this as they happen.
    defaultLogger.error(`Ignore unhandled rejection: ${e}`);
    e.ignore = true;
  } else {
    throw e;
  }
});

export const PlaywrightFetcher = class extends BaseFetcher {
  constructor(options) {
    super(options);
    this.headless = options?.headless === undefined ? true : options?.headless;
    if (process.env.HEADFUL) {
      this.headless = false;
    }
    this.browser = options?.browser || 'chromium';
    this.cdp = options?.cdp;

    this.pullIframes = options?.pullIframes;
    this.logger = options?.logger || defaultLogger;
    this.kv = options?.kv || getKV();
    this.shouldScreenshot = Boolean(this.s3); // TODO: separate option for this?
  }

  cacheOptions() {
    return {
      browser: 'chromium',
      loadWait: this.loadWait,
      waitForText: this.waitForText,
    };
  }

  async _launch() {
    this.logger.debug(`Playwright launching...`);

    let err;
    let i;
    for (i = 0; i < 3; i++) {
      try {
        let promise;
        if (this.cdp) {
          this.logger.debug(`Playwright using CDP endpoint, attempt=${i}`);
          promise = chromium.connectOverCDP(this.cdp);
        } else {
          this.logger.debug(`Playwright using local Chromium, attempt=${i}`);
          promise = chromium.launch({ headless: this.headless });
        }

        const browser = await promise;
        return browser;
      } catch (e) {
        this.logger.warn(`${this} Could not launch, retrying, attempt=${i}: ${e}`);
        err = e;
        await new Promise(ok => setTimeout(ok, i * 4000));
      }
    }

    this.logger.warn(`${this} Could not launch, throwing, attempt=${i}: ${err}`);
    throw err;
  }

  _ctxLastTouch(ctx) {
    ctx.lastTouch = new Date().getTime();
  }

  async start(ctx) {
    this._ctxLastTouch(ctx);
    const timer = ctx.timer || new Timer();

    if (ctx.browser) {
      throw new Error('Expect only one browser open at a time');
    }

    try {
      ctx.browser = await this._launch({ timer });
    } catch (e) {
      this.logger.error(`${this} Caught error while launching browser: ${e}`);
      throw e;
    }

    this.logger.debug(`${this} Got browser`);
    return ctx;
  }

  async _goto(url, ctx) {
    if (this.signal?.aborted) return;

    this._ctxLastTouch(ctx);

    if (!ctx.page) {
      ctx.page = await ctx.browser.newPage();
    }

    try {
      const { aborted } = await abortable(
        this.signal,
        ctx.page.goto(url, { waitUntil: 'domcontentloaded', timeout: this.loadTimeout }));
      if (aborted) {
        this.logger.warn(`${this} Aborted on goto`);
        return;
      }
    } catch (e) {
      this.logger.warn(`${this} Goto gave error, but continuing anyways: ${e}`);
    }
  }

  async current(ctx) {
    if (this.signal?.aborted) return;

    // No last touch, this is read-only

    let doc;
    let aborted;
    try {
      const result = await abortable(
        this.signal,
        this._docFromPage(ctx, ctx.timer));
      aborted = result.aborted;
      doc = result.result;
    } catch (e) {
      this.logger.error(`${this} Error while getting current doc: ${e}`);
      return;
    }
    if (aborted) {
      this.logger.warn(`${this} Aborted while getting current doc`);
      return;
    }

    await this.putS3(doc);

    return doc;
  }

  async finish(ctx) {
    this._ctxLastTouch(ctx);

    if (!ctx.browser) {
      return;
    }

    if (ctx.promise) {
      await pTimeout(ctx.promise, { milliseconds: this.timeout });
    }

    this.logger.debug(`${this} Closing browser`);
    await ctx.browser.close();
    delete ctx.browser;
  }

  async act(ctx, action, seen) {
    if (this.signal?.aborted) return;

    this._ctxLastTouch(ctx);

    const timer = ctx.timer || new Timer();
    this.logger.debug(`${this} Do action: ${JSON.stringify(action)}`);

    timer.push(`PlaywrightFetcher act ${action.type} ${action.arg}`);
    try {
      let r;
      switch (action.type) {
        case 'click':
          r = await this.click(
            ctx,
            action.arg,
            seen,
            { timeout: action.timeout || this.actionTimeout });
          break;

        case 'focus':
          r = await this.focus(
            ctx,
            action.arg,
            seen,
            { timeout: action.timeout || this.actionTimeout });
          break;

        case 'scroll':
          r = await this.scroll(
            ctx,
            action.arg,
            seen,
            { timeout: action.timeout || this.actionTimeout });
          break;

        default:
          throw new Error(`Unhandled action type: ${action.type}`);
      }

      this.logger.debug(`${this} Action wait ${(this.actionWait / 1000).toFixed(1)} sec`);
      r.ok && await new Promise(ok_ => setTimeout(ok_, this.actionWait));

      return r;
    } finally {
      timer.pop();
    }
  }

  async _actOnEl(ctx, selector, seen, options, fn) {
    this._ctxLastTouch(ctx);

    // TODO: for text= matchers, add a heuristic to prefer tighter  matches
    if (!selector.startsWith('text=') && !selector.startsWith('css=')) {
      this.logger.warn(`{this} Invalid selector: ${selector}`);
      return { ok: false };
    }

    if (selector.startsWith('text=')) {
      selector = selector.replaceAll('>', '&gt;');
    }

    const timeout = options?.timeout || this.actionTimeout;
    const loc = ctx.page.locator(selector);

    let el;
    let text;
    let html;

    // Look for the first matching element not in seen
    for (let i = 0; el == null; i++) {
      try {
        await loc.nth(i).waitFor({ state: 'attached', timeout });
        el = await loc.nth(i);

        if (!await el.isVisible()) {
          this.logger.debug(`${this} Skipping non visible element: ${el} on iteation ${i}`);
          el = null;
          continue;
        }

        text = await el.textContent();
        html = await el.evaluate(el => el.outerHTML);

        if (seen && (seen[text] || seen[html])) {
          el = null;
          continue;
        }

        this.logger.debug(`${this} Found new element ${el} after ${i} iterations`);
        await fn(ctx, el, timeout);

      } catch (e) {
        this.logger.warn(`${this} Caught error while trying to click ${el}: ${e}`);
        return { ok: false };
      }
    }

    return { ok: true, text, html };
  }

  async click(ctx, selector, seen, options) {
    this._ctxLastTouch(ctx);

    this.logger.debug(`${this} Click selector=${selector}`);

    const fn = async (ctx, el, timeout) => {
      this.logger.debug(`${this} Found ${el}, clicking, timeout=${timeout}`);
      await el.scrollIntoViewIfNeeded({ timeout });
      await el.click({ timeout });
    }

    return this._actOnEl(ctx, selector, seen, options, fn);
  }

  async focus(ctx, selector, seen, options) {
    this._ctxLastTouch(ctx);

    this.logger.debug(`${this} Focus selector=${selector}`);

    const fn = async (ctx, el, timeout) => {
      let skip = false;
      if (ctx.focused) {
        const elHtml = await el.evaluate(el => el.outerHTML);
        const focusHtml = await ctx.focused.evaluate(el => el.outerHTML);
        skip = elHtml == focusHtml;
      }

      if (skip) {
        this.logger.debug(`${this} Already focused on ${el}, skipping`);
        return;
      }

      this.logger.debug(`${this} Focusing on ${el} by clicking, timeout=${timeout}`);
      await el.click({ timeout });
      ctx.focused = el;
      this.logger.debug(`${this} Focus is now on ${ctx.focused}`);
    };

    return this._actOnEl(ctx, selector, seen, options, fn);
  }

  async scroll(ctx, type) {
    this._ctxLastTouch(ctx);

    this.logger.debug(`${this} Scroll type=${type}`);

    switch (type) {
      case 'page-down':
        // Do it twice for cases like Google Maps
        await ctx.page.keyboard.press('PageDown');
        await new Promise(ok => setTimeout(ok, 2000));
        await ctx.page.keyboard.press('PageDown');
        break;

      case 'bottom':
        /* eslint-disable no-undef */
        await ctx.page.evaluate(async () => {
          document.scrollToBottom = async () => {
            const top = document.documentElement.scrollHeight;
            return new Promise((ok) => {
              document.addEventListener('scrollend', ok);
              setTimeout(ok, 2000);
              window.scrollTo({ top, behavior: 'smooth' });
            });
          }

          await document.scrollToBottom();
        });
        /* eslint-enable no-undef */
        break;
      default:
        this.logger.error(`${this} Unhandled scroll type: ${type}`);
    }

    return { ok: true };
  }

  async _docFromPage(ctx, timer) {
    timer ||= new Timer();

    let html;
    let status;

    timer.push('PlaywrightFetcher _docFromPage');
    try {
      const result = await abortable(
        this.signal,
        getHtmlFromSuccess(
          ctx,
          {
            loadWait: this.loadWait,
            pullIframes: this.pullIframes,
            logger: this.logger,
            signal: this.signal,
          }));

      if (result.aborted) {
        return;
      }
      status = 200;

      html = result.result.html;
    } catch (e) {

      this.logger.error(`Playwright could not get from ${ctx.page.url()}: ${e}`);
      this.logger.debug(`Trying to salvage results`);

      try {
        const result = await abortable(
          this.signal,
          getHtmlFromError(ctx.page, { logger: this.logger }));
        if (result.aborted) {
          return;
        }
        html = result.result.html;

      } catch (e) {
        this.logger.warn(`Could not salvage results, give up: ${e}`);
        return;
      }
      if (!html) {
        this.logger.warn(`Could not salvage results, give up`);
        return;
      }
      this.logger.warn(`Read ${html.length} bytes from failed Playwright request`);
      status = 500;
    } finally {
      timer.pop();
    }

    const url = ctx.page.url();

    timer.push(`Take screenshot`);
    let screenshotUrl;
    if (this.shouldScreenshot) {
      try {
        const keyTemplate = this.s3.key || 'fetchfox-docs/ss/{id}/{url}.png';
        const id = srid(10);
        const cleanUrl = url.replace(/[^A-Za-z0-9]+/g, '-');
        const key = keyTemplate
          .replaceAll('{id}', id)
          .replaceAll('{url}', cleanUrl);

        screenshotUrl = urlForKey(key, this.s3);

        const promise = ctx.page.screenshot({ type: 'png' })
          .then((buf) => putS3(key, buf, this.s3))
          .catch((e) => {
            this.logger.warn(`${this} Error while getting or uploading screenshot, ignore: ${e}`);
          });

        // This can be awaited before closing the browser
        ctx.promise = promise;

      } finally {
        timer.pop();
      }
    }

    const data = {
      status,
      url,
      body: html,
      html,
      screenshotUrl,
      // TODO: get content type from the response object
      headers: {'content-type': 'text/html; charset=utf-8' },
    };

    const doc = new Document();
    doc.loadData(data);

    return doc;
  }
}

const getHtmlFromSuccess = async ({ page, lastTouch }, { loadWait, pullIframes, logger, signal }) => {
  const now = new Date().getTime();
  lastTouch ||= now;
  const diff = now - lastTouch;

  // TODO: double check this before pushing it to prod
  // const wait = Math.max(1, loadWait - diff);
  let wait = loadWait;

  if (page.url().includes('https://www.finefettle.com/')) {
    wait = 15 * 1000;
    logger.debug(`Extra wait for finefettle.com: ${wait}`);
  }

  if (page.url().includes('https://www.onthebeach.co.uk/')) {
    wait = 20 * 1000;
    logger.debug(`Extra wait for www.onthebeach.co.uk: ${wait}`);
  }

  logger.debug(`Load waiting ${(wait / 1000).toFixed(1)} sec based on loadWait=${loadWait}, touch diff=${diff}`);
  await new Promise(ok => setTimeout(ok, wait));

  if (pullIframes) {
    // Get all the iframes
    logger.debug(`Get iframes on ${page.url()}`);
    let frames;
    try {
      frames = await page.frames();
    } catch (e) {
      this.logger.error(`${this} Error while getting frames: ${e}`);
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
        content = await iframe.content({ timeout: 10 * 1000 });
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
    logger.debug(`Done getting iframes`);
  }

  if (signal?.aborted) {
    return;
  }

  logger.debug(`Getting HTML from ${page.url()}`);

  let html;
  let err;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      html = await page.evaluate(() => {
        document.querySelectorAll('*').forEach(el => {
          if (el.shadowRoot) {
            const shadow = document.createElement('shadow');
            shadow.innerHTML = el.shadowRoot.innerHTML;
            el.appendChild(shadow);
          }
        });

        return document.documentElement.outerHTML;
      });
      err = null;
      break;

    } catch (e) {
      err = e;
      logger.warn(`Error while trying to get HTML from ${page.url()} on attempt=${attempt + 1}: ${e}`);
      await new Promise(ok => setTimeout(ok, 1000 * 2 * (attempt + 1)));
    }
  }

  if (err) {
    throw err;
  }

  return { html };
}

const getHtmlFromError = async (page, { logger }) => {
  // Disable undefined variable linting for document variables
  // which is available in Playwright's browser context.
  /* eslint-disable no-undef */
  try {
    logger.debug(`Get HTML from error result on ${page.url()}`);
    const html = await page.evaluate(() => document.documentElement.outerHTML);
    return html
  } catch (e) {
    logger.error(`Failed to get HTML from error result, got another error: ${e}`);
    return null;
  }
  /* eslint-enable no-undef */
}
