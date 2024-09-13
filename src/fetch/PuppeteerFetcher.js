import crypto from 'crypto';
import puppeteer from 'puppeteer';
import { logger } from '../log/logger.js';
import { Document } from '../document/Document.js';
import { BaseFetcher } from './BaseFetcher.js';

export const PuppeteerFetcher = class extends BaseFetcher {
  constructor(options) {
    super(options);
    const { browserOptions } = options || {};
    if (browserOptions) this.browserOptions = browserOptions;
  }

  async fetch(url, options) {
    logger.info(`Puppeteer fetch ${url} with options ${options || '(none)'}`);

    const cached = await this.getCache(url, options);
    if (cached) {
      return cached;
    }

    const browser = await puppeteer.launch(this.browserOptions);

    const page = await browser.newPage();
    await page.setViewport({width: 1080, height: 1024});

    const resp = { url };
    page.on('response', async (r) => {
      if (!resp.headers) resp.headers = r.headers();
      // TODO...
    });

    await page.goto(url);

    const { html } = await page.evaluate(getTextAndHtml);

    const doc = new Document();
    doc.loadData({
      url,
      body: html,
      resp,
    });

    await browser.close();

    this.setCache(url, options, doc.dump());

    return doc;
  }
}

const getTextAndHtml = async () => {
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // TODO: dynamic compute for this
  await sleep(5000);

  // via https://chatgpt.com/share/ef8bcaec-6fb1-478b-a074-1ae22c908ae2
  const getText = (node) => {
    let t = '';
    if (node.nodeType === Node.TEXT_NODE) {
      t += ' ' + node.textContent.trim();
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (!['script', 'style'].includes(node.nodeName.toLocaleLowerCase())) {
        if (node.shadowRoot) {
          t += ' ' + getText(node.shadowRoot);
        }
        node.childNodes.forEach(child => {
          t += ' ' + getText(child);
        });
      }
    }
    return t;
  }

  // Via https://chatgpt.com/share/e9a142ab-775d-4f1d-8a84-69f829ffc45c
  const getHtml = (node) => {
    let clone = node.cloneNode(true);

    const removeTags = ['style', 'path'];

    // Remove LinkedIn junk
    // TODO: more resilient solution
    if (url.indexOf('https://www.linkedin.com') != -1) {
      removeTags.push('code');
    }

    for (const tagName of removeTags) {
      clone
        .querySelectorAll(tagName)
        .forEach(el => el.remove());
    }

    // Remove hidden elements, LinkedIn puts in a bunch of these
    const els = clone.querySelectorAll('*');
    els.forEach((el) => {
      const style = window.getComputedStyle(el);
      if (style.display == 'none') el.remove();
    });

    return clone.outerHTML;
  }

  const url = window.location.href;
  let text = getText(document.body) || '';
  let html = getHtml(document.body) || '';

  return { text, html };
}
