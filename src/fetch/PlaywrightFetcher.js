import fetch from 'node-fetch';
import playwright from 'playwright';
import { logger } from '../log/logger.js';
import { Document } from '../document/Document.js';
import { BaseFetcher } from './BaseFetcher.js';

export const PlaywrightFetcher = class extends BaseFetcher {
  constructor(options) {
    super(options);
    this.headless = options.headless === undefined ? true : options.headless;
  }

  async fetch(url, options) {
    logger.info(`Playwright fetch ${url} with options ${options || '(none)'}`);

    try {
      new URL(url);
    } catch (e) {
      return null;
    }

    if (url.indexOf('javascript:') == 0) {
      return null;
    }

    const cached = await this.getCache(url, options);
    if (cached) {
      logger.info(`Returning cached ${cached}`);
      return cached;
    }

    const doc = new Document();

    let browser;

    try {
      browser = await playwright.chromium.launch({ headless: this.headless });
      const page = await browser.newPage();
      const resp = await page.goto(url);

      logger.info(`Playwright got response: ${resp.status()} for ${resp.url()}`);

      await new Promise(ok => setTimeout(ok, 4000));

      await doc.read(resp, url, options);

      this.setCache(url, options, doc.dump());

      return doc;
    } finally {
      await browser.close();
    }
  }
}
