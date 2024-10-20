import playwright from 'playwright';
import { logger } from '../log/logger.js';
import { getAI } from '../index.js';
import { getExtractor } from '../index.js';
import { Document } from '../document/Document.js';
import { Finder } from './Finder.js';

export const Actor = class {
  constructor(options) {
    this.ai = options?.ai || getAI();
    this.extractor = options?.extractor || getExtractor();
  }

  async act(url, actions) {

    console.log(JSON.stringify(actions, null, 2));
    try {
      const indexes = Array(actions.length).fill(0)
      const final = await this._inner(url, actions, indexes);

    } finally {
      await this.browser.close();
    }
  }

  async _inner(url, actions, indexes) {
    this.browser = await playwright.chromium.launch({ headless: false });
    let activeUrl = url;
    this.browser.on('page', async (p) => {
      console.log('browser on page', p);
      await p.waitForLoadState();
      activeUrl = p.url();
    });

    const page = await this.browser.newPage();
    await page.goto(url);

    const results = [];

    const finder = new Finder({ ai: this.ai });
    // for (let i = 0; i < actions.length; i++) {

    let index = 0;
    while (true) {
      const [action, query, selector] = actions[index];
      console.log('action, query, selector:', query, selector);
      console.log(JSON.stringify(action, null, 2));

      if (action == 'extract') {
        // console.log('url', activeUrl);

        const doc = new Document();
        const data = {
          url: page.url(),
          html: await page.content(),
          text: await page.evaluate(() => document.body.innerText),
          contentType: 'text/html',
        };
        // console.log(JSON.stringify(data, null, 2));
        doc.loadData(data);
        // console.log('extract from:' + data.url);
        // console.log('extract from:' + doc);

        const ex = this.extractor;
        console.log('query');
        console.log(JSON.stringify(query));
        for await (const output of ex.stream(doc, [query])) {
          console.log('GOT:', output);
        }

      } else {
        const ffids = await finder.find(page, query, selector);
        // console.log('index', index);
        // console.log('indexes', indexes);
        // console.log('ffids', ffids);
        const v = ffids[indexes[index]];
        const ffid = v?.ffid;
        // console.log('using ffid:', v, ffid);
        indexes[index]++;
        if (!ffid) {
          console.log('No ffid, probably done');
          break;
        }

        const el = await page.locator(`css=[ffid="${ffid}"]`).first();
        console.log('EL', el);
        switch (action) {
          case 'click':
            await el.click();
            console.log('CLICK!!');
            break;
          default:
            throw new Error(`Unhandled action: ${action}`);
        }
      }

      await new Promise(ok => setTimeout(ok, 4000));

      // throw 'STOP';
      // for (const { ffid } of ffids) {
      //   console.log('ffid', ffid);
      //   const el = await page.locator(`css=[ffid="${ffid}"]`).first();
      //   console.log('el', el);
      //   switch (action) {
      //     case 'click':
      //       await el.click();
      //       console.log('CLICK!!');
      //       break;
      //     default:
      //       throw new Error(`Unhandled action: ${action}`);
      //   }
      // }

      index++;
      if (index >= actions.length) {
        index = 0;
        await page.goto(url);
      }
    }


    return results;

    // for (const page of last) {
    //     const content = await page.content();
    //     // console.log('FFID CONTENT', content);
    //     console.log('ffid', ffid);
    //     const newPage = await this.browser.newPage();
    //     await newPage.setContent(content);
    //     // await newPage.evaluate((ffid) => {
    //     //   console.log(123);
    //     //   console.log('ffid', ffid);
    //     //   alert('123');
    //     // }, ffid);
    //     const newEl = await newPage.locator(`css=[ffid="${ffid}"]`).first();
    //     console.log('newEl', newEl);
    //     switch (action) {
    //       case 'click':
    //         await newEl.click();
    //         break;
    //       default:
    //         throw new Error(`Unhandled action: ${action}`);
    //     }
    //     // this.head.push(page);
    //     console.log('Acted!!');
    //     await new Promise(ok => setTimeout(ok, 400000));
    //     break;
    //   }
    //   break;
    // }
    // await new Promise(ok => setTimeout(ok, 2000));
    // throw 'act TODO';
  }

  async finish() {
    try {
      // await this.browser.close();
      return this.head;
    } finally {
      this.head = [];
    }
  }
}
