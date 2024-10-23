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

  async _fetch(url, options) {
    logger.info(`Playwright fetch ${url} with options ${options || '(none)'}`);

    const doc = new Document();

    let browser;
    try {
      browser = await playwright.chromium.launch({ headless: this.headless });
      const page = await browser.newPage();
      const resp = await page.goto(url);
      logger.info(`Playwright got response: ${resp.status()} for ${resp.url()}`);
      // await new Promise(ok => setTimeout(ok, 4000));

      // Get all the iframes
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
      for (let i = 0; i < iframes.length; i++) {
        const iframe = iframes[i];
        const content = await iframe.content();
        const result = await page.evaluate(({ index, content }) => {
          const iframes = document.querySelectorAll('iframe');
          const iframe = iframes[index];
          if (iframe) {
            const div = document.createElement('div');
            div.innerHTML = iframe.outerHTML.replace(
              '</iframe>',
              content + '</iframe>');
            iframe.replaceWith(div);
          }
        }, { index: i, content });
      }
      const html = await page.content();
      console.log('html', html);
      resp.text = () => html;
      const doc = new Document();
      await doc.read(resp, url, options);

      return doc;
    } finally {
      await browser.close();
    }
  }
}
