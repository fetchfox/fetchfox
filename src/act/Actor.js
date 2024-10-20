import playwright from 'playwright';
import { logger } from '../log/logger.js';
import { getAI } from '../ai/index.js';
import { getExtractor } from '../extract/index.js';
import { Document } from '../document/Document.js';
import { Finder } from './Finder.js';

export const Actor = class {
  constructor(options) {
    this.ai = options?.ai || getAI();
    this.extractor = options?.extractor || getExtractor();
  }

  toString() {
    const url = this.url();
    return `[Actor ${url.length > 40 ? url.substr(32) + '...' : url } ${(this.history || []).length} acts]`;
  }

  url() {
    return this.page?.url();
  }

  async doc() {
    logger.verbose(`Doc from ${this.url()}`);
    const doc = new Document();
    const data = {
      url: this.url(),
      html: await this.page.content(),
      text: await this.page.evaluate(() => document?.body?.innerText || ''),
      contentType: 'text/html',
    };
    doc.loadData(data);
    return doc;
  }

  async replay() {
    const copy = new Actor(this);
    for (const h of this.history) {
      if (h.action == 'start') {
        if (copy.url()) throw new Error('Unexpected double start');
        await copy.start(h.url);

      } else {
        copy.index = h.index;
        await copy.act(h.action, h.query, h.selector);
      }
    }

    copy.history = JSON.parse(JSON.stringify(this.history));
    copy.index = this.index;
    return copy;
  }

  async fork(action, query, selector) {
    const fork = await this.replay();
    const done = await fork.act(action, query, selector);
    this.history = JSON.parse(JSON.stringify(fork.history));
    this.history.pop();
    this.index = fork.index + 1;
    return [fork, done];
  }

  async start(url) {
    if (this.browser) throw new Error('double browser');

    this.browser = await playwright.chromium.launch({ headless: true });
    this.browser.on('page', async (p) => {
      await p.waitForLoadState();
      this.url = p.url();
    });

    this.page = await this.browser.newPage();
    await this.page.goto(url);

    this.index = 0;
    this.history = [{ action: 'start', url }];
  }

  finder(query, selector) {
    return new Finder(this.ai, this.page, query, selector);
  }

  async act(action, query, selector) {
    logger.verbose(`Acting ${action} for ${query} matching ${selector} on ${this.url()}`);
    const results = await (this.finder(query, selector).limit(this.index + 1));
    let done = this.index >= results.length;
    if (!done) {
      const el = results[this.index];
      await this._do(action, el);
      this.history.push({ action, query, selector, index: this.index });

      this.index++
    }

    return done;
  }

  async _do(action, el) {
    logger.verbose(`Actor doing ${action} on ${el}`);
    switch (action) {
      case 'click':
        await el.click();
        break;
      default:
        throw new Error(`Unhandled action: ${action}`);
    }
  }

  async finish() {
    await this.browser.close();
    this.browser = null;
  }
}
