import { chromium } from 'playwright-extra';
import { Timer } from '../log/timer.js';
import { logger as defaultLogger } from '../log/logger.js';
import { Document } from '../document/Document.js';
import { BaseFetcher } from './BaseFetcher.js';
import { abortable } from '../util.js';

process.on('unhandledRejection', (e) => {
  if (e.name == 'TargetClosedError') {
    // These exceptions occur sometimes on browser launch, and we cannot
    // catch them in this as they happen.
    defaultLogger.error(`Ignore unhandled rejection: ${e}`);
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
    this.blockMediaRequests = options?.blockMediaRequests
    this.logger = options?.logger || defaultLogger;

  }

  cacheOptions() {
    return {
      browser: 'chromium',
      loadWait: this.loadWait,
      waitForText: this.waitForText,
    };
  }

  async _setPageNetworkPolicy(ctx) {
    const resourceTypesToBlock = [
      "stylesheet", "image", "media", "font"
    ]

    await page.route("**/*", async route => {
      resourceType = route.request().resourceType()
      if (resourceTypesToBlock.includes(resourceType)){
        await route.abort()
      } else {
        await route.continue()
      }
    })
  }

  async _setPageNetworkPolicy(ctx) {
    if (!ctx.page || !this.blockMediaRequests) return;

    // see https://playwright.dev/docs/api/class-request#request-resource-type
    const resourceTypesToBlock = ["stylesheet", "image", "media", "font"];

    await ctx.page.route("**/*", async route => {
      const resourceType = route.request().resourceType();
      if (resourceTypesToBlock.includes(resourceType)) {
        await route.abort();
      } else {
        await route.continue();
      }
    });
  }


  async _goto(url, ctx) {
    if (!ctx.page) {
      ctx.page = await ctx.browser.newPage();
      await this._setPageNetworkPolicy(ctx)
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
    let doc;
    let aborted;
    try {
      const result = await abortable(this.signal, this._docFromPage(ctx.page, ctx.timer));
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


  async _launch() {
    this.logger.debug(`Playwright launching...`);

    let err;
    let i;
    for (i = 0; i < 3; i++) {
      try {
        let promise;
        if (this.cdp) {
          this.logger.debug(`Playwright using CDP endpoint ${this.cdp}, attempt=${i}`);
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

  async start(ctx) {
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

  async finish(ctx) {
    if (!ctx.browser) {
      return;
    }

    this.logger.debug(`${this} Closing browser`);
    await ctx.browser.close();
    delete ctx.browser;
  }

  async act(ctx, action, seen) {
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
    // TODO: for text= matchers, add a heuristic to prefer tighter  matches
    if (!selector.startsWith('text=') && !selector.startsWith('css=')) {
      this.logger.warn(`{this} Invalid selector: ${selector}`);
      return { ok: false };
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
    this.logger.debug(`${this} Click selector=${selector}`);

    const fn = async (ctx, el, timeout) => {
      this.logger.debug(`${this} Found ${el}, clicking, timeout=${timeout}`);
      await el.scrollIntoViewIfNeeded({ timeout });
      await el.click({ timeout });
    }

    return this._actOnEl(ctx, selector, seen, options, fn);
  }

  async focus(ctx, selector, seen, options) {
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
    this.logger.debug(`${this} Scroll type=${type}`);

    // TODO: Check if scrolling worked

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

  async _docFromPage(page, timer) {
    timer ||= new Timer();

    let html;
    let text;
    let selectHtml;
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
            logger: this.logger,
          }));

      if (result.aborted) {
        return;
      }
      status = 200;

      html = result.result.html;
      text = result.result.text;
      selectHtml = result.result.selectHtml;
    } catch (e) {

      this.logger.error(`Playwright could not get from ${page.url()}: ${e}`);
      this.logger.debug(`Trying to salvage results`);

      try {
        const result = await abortable(
          this.signal,
          getHtmlFromError(page, { logger: this.logger }));
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

    const url = page.url();
    const data = {
      status,
      url,
      body: html,
      html,
      text,
      selectHtml: selectHtml,
      headers: {'content-type': 'text/html' },
    };

    const doc = new Document();
    doc.loadData(data);

    return doc;
  }
}

const getHtmlFromSuccess = async (page, { loadWait, pullIframes, logger }) => {
  logger.debug(`Load waiting ${(loadWait / 1000).toFixed(1)} sec`);
  await new Promise(ok => setTimeout(ok, loadWait));

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

  // Minimize the HTML before returning it
  logger.debug(`Minimizing HTML on ${page.url()}`);
  let outs;
  try {
    const html = await page.evaluate(() => document.documentElement.outerHTML);
    //debugger;
    return {html:html}
    /* eslint-disable no-undef */
    /**outs = await page.evaluate(async () => {
      // Attach the function to document to avoid errors in certain situations,
      // eg. https://github.com/privatenumber/tsx/issues/113
      document.toText = (min, node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.nodeValue;
        }

        let r = '';

        for (const child of node.childNodes) {
          const name = (child.tagName || '').toLowerCase();
          const keep = (min.keep?.tags || []).includes(name);
          if (keep) {
            let str = ` <${name}`;
            for (const attr of min.keep.attrs || []) {
              str += ` ${attr}="${child.getAttribute(attr)}"`;
            }
            str += '>';

            let ccText = '';
            for (const cc of child.childNodes) {
              ccText += ' ' + document.toText(min, cc) + ' ';
            }
            ccText = ccText.trim();

            // Heuristic: if it's really short, use the inner HTML
            if (ccText.length < 10) {
              ccText = child.innerHTML;
            }

            str += ccText;

            str += `</${name}> `;

            r += str;
          } else {
            r += document.toText(min, child);
          }
        }

        return r;
      };

      const remove = {
        tags: ['script', 'style', 'svg', 'symbol', 'link', 'meta'],
        attrs: ['style'],
      };

      const minimizers = [
        // Default minimizer removes large junk tags and style attribute
        {
          name: 'html',
          remove,
          keep: {},
        },

        // Text only minimizer
        {
          name: 'text',
          remove,
          text: true,
        },

        // Links minimzer keeps only text and <a href="...">
        {
          name: 'selectHtml',
          remove,
          text: true,
          keep: {
            tags: ['a'],
            attrs: ['href'],
          },
        },
      ];

      const outs = {};
      for (const min of minimizers) {
        const clone = document.documentElement.cloneNode(true);

        // Remove tags
        (min.remove?.tags || []).forEach(tag => {
          clone.querySelectorAll(tag).forEach(element => {
            element.replaceWith('');
          });
        });

        // Remove attributes
        clone.querySelectorAll('*').forEach(el => {
          (min.remove?.attrs || []).forEach(attr => {
            el.removeAttribute(attr);
          });
        });

        let result = clone.outerHTML;

        // Text conversion
        if (min.text) {
          result = document.toText(min, clone);
        }

        outs[min.name] = result.replace(/[ \t\n]+/g, ' ').trim();
      }

      return outs;
      *
    });
    /* eslint-enable no-undef */
  } catch (e) {
    logger.error(`Error while getting HTML: ${e}`);
  }

  return {
    html: outs.html,
    text: outs.html,
    selectHtml: outs.html,
  };
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
