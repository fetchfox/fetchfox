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
    if (!ctx.page) {
      ctx.page = await ctx.browser.newPage();
    }

    try {
      const { aborted } = await abortable(
        this.signal,
        ctx.page.goto(url, { waitUntil: 'domcontentloaded' }));
      if (aborted) {
        logger.warn(`${this} Aborted on goto`);
        return;
      }
    } catch (e) {
      logger.warn(`${this} Goto gave error, but continuing anyways: ${e}`);
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
      logger.error(`${this} Error while getting current doc: ${e}`);
      return;
    }
    if (aborted) {
      logger.warn(`${this} Aborted while getting current doc`);
      return;
    }

    await this.putS3(doc);

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

    if (ctx.browser) {
      throw new Error('Expect only one browser open at a time');
    }

    try {
      ctx.browser = await this._launch({ timer });
    } catch (e) {
      logger.error(`${this} Caught error while launching browser: ${e}`);
      throw e;
    }

    logger.debug(`${this} Got browser`);

    return ctx;
  }

  async finish(ctx) {
    if (!ctx.browser) {
      return;
    }

    logger.debug(`${this} Closing browser`);
    await ctx.browser.close();
    delete ctx.browser;
  }

  async act(ctx, action, seen) {
    logger.debug(`${this} Do action: ${JSON.stringify(action)}`);

    let r;

    switch (action.type) {
      case 'click':
        r = await this.click(ctx, action.arg, seen);
        break;

      case 'scroll':
        r = await this.scroll(ctx, action.arg, seen);
        break;

      default:
        throw new Error(`Unhandled action type: ${action.type}`);
    }

    logger.debug(`${this} Action wait ${(this.actionWait / 1000).toFixed(1)} sec`);
    r.ok && await new Promise(ok_ => setTimeout(ok_, this.actionWait));

    return r;
  }

  async click(ctx, selector, seen) {
    logger.debug(`${this} Click selector=${selector}`);

    if (!selector.startsWith('text=') && !selector.startsWith('css=')) {
      logger.warn(`{this} Invalid selector: ${selector}`);
      return { ok: false };
    }

    const loc = ctx.page.locator(selector);

    let el;
    let text;
    let html;

    // Look for the first matching element not in seen
    for (let i = 0; el == null; i++) {
      try {
        await loc.nth(i).waitFor({ state: 'attached', timeout: 1000 });
      } catch (e) {
        logger.warn(`${this} Caught error while waiting for ${loc} nth=${i}: ${e}`);
        return { ok: false };
      }

      el = await loc.nth(i);
      text = await el.textContent();
      html = await el.evaluate(el => el.outerHTML);

      if (seen && (seen[text] || seen[html])) {
        el = null;
        continue;
      }

      logger.debug(`${this} Found new element ${el} after ${i} iterations`);
    }

    await el.scrollIntoViewIfNeeded();
    await el.click();

    return { ok: true, text, html };
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
        break;

      case 'bottom':
        /* eslint-disable no-undef */
        await ctx.page.evaluate(async () => {
          const scrollToBottom = async () => {
            const top = document.documentElement.scrollHeight;
            return new Promise((ok) => {
              const fn = () => {
                document.removeEventListener('scrollend', fn);
                ok();
              }
              document.addEventListener('scrollend', fn);
              window.scrollTo({ top, behavior: 'smooth' });
            });
          }

          await scrollToBottom();
        });
        /* eslint-enable no-undef */
        break;
      default:
        logger.error(`${this} Unhandled scroll type: ${type}`);
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
          }));

      if (result.aborted) {
        return;
      }
      status = 200;

      html = result.result.html;
      text = result.result.text;
      selectHtml = result.result.selectHtml;
    } catch (e) {

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

  // Minimize the HTML before returning it
  logger.debug(`Minimizing HTML on ${page.url()}`);
  let outs;
  try {
    /* eslint-disable no-undef */
    outs = await page.evaluate(async () => {
      const remove = {
        tags: ['script', 'style', 'svg', 'symbol', 'link', 'meta'],
        attrs: ['style'],
      };

      const minimizers = [
        {
          name: 'html',
          remove,
          keep: {},
        },
        {
          name: 'text',
          remove,
          text: true,
        },
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

        (min.remove?.tags || []).forEach(tag =>
          clone.querySelectorAll(tag).forEach(element => {
            element.replaceWith('');
          })
        );

        clone.querySelectorAll('*').forEach(el =>
          (min.remove?.attrs || []).forEach(attr => {
            el.removeAttribute(attr);
          })
        );

        let result = clone.outerHTML;

        if (min.text) {
          let res = '';
          const stack = [];

          stack.push({
            node: clone,
            i: 0,
            textBuffer: '',
            kept: (
              clone.nodeType === Node.ELEMENT_NODE &&
              (min.keep?.tags || []).includes(clone.tagName.toLowerCase())
            ),
          });

          // Using iterative approach instead of recursion to workaround
          // a Playwright bug:
          // - https://github.com/privatenumber/tsx/issues/113
          // - https://chatgpt.com/share/67aa9733-b56c-800e-a605-439bfa12bce8
          while (stack.length > 0) {
            const frame = stack[stack.length - 1];
            if (frame.i < frame.node.childNodes.length) {
              const child = frame.node.childNodes[frame.i];
              frame.i++;

              if (child.nodeType === Node.TEXT_NODE) {
                // If the parent is marked as "kept", add extra spacing.
                frame.textBuffer += frame.kept ? (' ' + child.nodeValue + ' ') : child.nodeValue;

              } else {
                // Push a new frame for this child element, with an inline "isKept" check.
                stack.push({
                  node: child,
                  i: 0,
                  textBuffer: '',
                  kept: child.nodeType === Node.ELEMENT_NODE &&
                  (min.keep?.tags || []).includes(child.tagName.toLowerCase())
                });
              }

            } else {
              let frameResult = frame.textBuffer;
              if (frame.node.nodeType === Node.ELEMENT_NODE && frame.kept) {
                let ccText = frameResult.trim();
                // Heuristic: if the text is very short, fall back to innerHTML.
                if (ccText.length < 10) {
                  ccText = frame.node.innerHTML;
                }
                const tag = frame.node.tagName.toLowerCase();
                let tagStr = ` <${tag}`;
                (min.keep?.attrs || []).forEach(attr => {
                  tagStr += ` ${attr}="${frame.node.getAttribute(attr)}"`;
                });
                tagStr += `>${ccText}</${tag}> `;
                frameResult = tagStr;
              }

              stack.pop();

              if (stack.length > 0) {
                const parentFrame = stack[stack.length - 1];
                parentFrame.textBuffer += parentFrame.kept ? (' ' + frameResult + ' ') : frameResult;
              } else {
                res = frameResult;
              }
            }
          }

          result = res.replace(/[ \t\n]+/g, ' ').trim();
        }

        outs[min.name] = result.replace(/[ \t\n]+/g, ' ').trim();
      }

      return outs;
    });

    /* eslint-enable no-undef */
  } catch (e) {
    logger.warn(`${this} Error while getting HTML: ${e}`);
  }

  return {
    html: outs.html,
    text: outs.text,
    selectHtml: outs.selectHtml,
  };
}

const getHtmlFromError = async (page) => {
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
