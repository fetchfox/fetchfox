import { logger } from '../log/logger.js';
import { Fetcher } from 'fetchfox';
import { chromium } from 'playwright';
import { Document } from '../document/Document.js';

export const BritishAirwaysFetcher = class extends Fetcher {
  async *_fetch(url, options) {
    const cdp = 'wss://brd-customer-hl_e9028181-zone-scraping_browser1:96m97ovmklqe@brd.superproxy.io:9222';

    logger.debug(`${this} connectd over CDP ${cdp}`);

    const browser = await chromium.connectOverCDP(cdp);
    const context = browser.contexts()[0] || await browser.newContext();
    const page = await context.newPage();

    logger.debug(`${this} goto ${url}`);
    await page.goto(url);

    await page.waitForSelector('#ensAcceptAll', { timeout: 20000 });
    await new Promise(ok => setTimeout(ok, 100));
    const el = await page.$('#ensAcceptAll');

    logger.debug(`${this} got element ${el}`);
    await page.click('#ensAcceptAll');
    await new Promise(ok => setTimeout(ok, 100));

    await page.waitForSelector('text=Prices are per adult', { timeout: 20000 });
    const html = await page.content();

    const resp = {
      status: () => 200,
      url: () => url,
      body: () => html,
      html: () => html,
      text: () => html,
      headers: { 'content-type': 'text/html' },
    };
    const doc = new Document();
    await doc.read(resp, url, options);

    logger.info(`${this} returning: ${doc}`);
    yield Promise.resolve(doc);
  }
}
