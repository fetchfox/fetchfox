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

  async rerun() {
    const copy = new Actor(this);

    console.log('');
    console.log('');
    console.log('Rerun:', this.history);

    for (const h of this.history) {
      console.log('Execute history:', h);

      if (h.action == 'start') {
        console.log('copy url', copy.url());
        if (copy.url()) throw new Error('Unexpected double start');
        await copy.start(h.url);
      } else {
        copy.index = h.index;
        await copy.act(h.action, h.query, h.selector);
      }
    }

    copy.history = JSON.parse(JSON.stringify(this.history));
    return copy;

    // await clone.start(this.history[0].url);
    // if (this.history.length > 1) {
    //   // throw new Error('TODO: copy multistep history');
    //   for (const h of this.history.slice(1)) {
    //     console.log('Execute history:', h);
    //     const finder = new Finder({ ai: this.ai });
    //     const { map } = await finder.label(this.page, h.selector);
    //     // console.log('map', map);
    //     // console.log('map', map[h.ffid]);
    //     // await map[h.ffid].click();
    //     // const loc = await this.page.locator('css=a.btn');
    //     // const first = await loc.first();
    //     // const all = await loc.all();
    //     // const tgt = all[parseInt(h.ffid)];
    //     // console.log('click first', tgt);
    //     // tgt.click();
    //     // console.log('ok!');
    //     await this._do(h.action, h.selector, h.ffid);
    //     throw 'STOP4';
    //   }
    // }
  }

  url() {
    return this.page?.url();
  }

  async start(url) {
    this.browser = await playwright.chromium.launch({ headless: true });
    this.browser.on('page', async (p) => {
      console.log('browser on page: ' + p);
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
    const results = await (this.finder(query, selector).all());
    console.log('GOT RESULTS', results);
    let done = this.index >= results.length;
    if (!done) {
      // const ffid = ffids[this.index++];
      const el = results[this.index];
      await this._do(action, el);
      this.history.push({ action, query, selector, index: this.index });

      this.index++
    }

    return done;
  }

  async _do(action, el) {
    switch (action) {
      case 'click':
        console.log('EL', el);
        console.log(JSON.stringify(el));
        await el.click();
        break;
      default:
        throw new Error(`Unhandled action: ${action}`);
    }
  }

  // async _do_old(action, selector, ffid) {
  //   console.log('get ffid:', selector, ffid);
  //   // const el = await this.page.locator(`css=[ffid="${ffid}"]`).first();
  //   const loc = await this.page.locator(`css=${selector}`);
  //   const all = await loc.all()
  //   const el = all[parseInt(ffid)];
  //   console.log('got el -->', el);
  //   switch (action) {
  //     case 'click':
  //       console.log('CLICK!!');
  //       await el.click();
  //       break;
  //     default:
  //       throw new Error(`Unhandled action: ${action}`);
  //   }
  // }

  async doc() {
    const doc = new Document();
    const data = {
      url: this.page.url(),
      html: await this.page.content(),
      text: await this.page.evaluate(() => document.body.innerText),
      contentType: 'text/html',
    };
    doc.loadData(data);
    return doc;
  }

  // async act_old(url, actions) {
  //   console.log(JSON.stringify(actions, null, 2));
  //   try {
  //     const indexes = Array(actions.length).fill(0)
  //     const final = await this._inner(url, actions, indexes);

  //   } finally {
  //     await this.browser.close();
  //   }
  // }

  // async _inner(url, actions, indexes) {
  //   this.browser = await playwright.chromium.launch({ headless: false });
  //   let activeUrl = url;
  //   this.browser.on('page', async (p) => {
  //     console.log('browser on page', p);
  //     await p.waitForLoadState();
  //     activeUrl = p.url();
  //   });

  //   const page = await this.browser.newPage();
  //   await page.goto(url);

  //   const results = [];

  //   const finder = new Finder({ ai: this.ai });
  //   // for (let i = 0; i < actions.length; i++) {

  //   let index = 0;
  //   while (true) {
  //     const [action, query, selector] = actions[index];
  //     console.log('action, query, selector:', query, selector);
  //     console.log(JSON.stringify(action, null, 2));

  //     if (action == 'extract') {
  //       // console.log('url', activeUrl);

  //       const doc = new Document();
  //       const data = {
  //         url: page.url(),
  //         html: await page.content(),
  //         text: await page.evaluate(() => document.body.innerText),
  //         contentType: 'text/html',
  //       };
  //       // console.log(JSON.stringify(data, null, 2));
  //       doc.loadData(data);
  //       // console.log('extract from:' + data.url);
  //       // console.log('extract from:' + doc);

  //       const ex = this.extractor;
  //       console.log('query');
  //       console.log(JSON.stringify(query));
  //       for await (const output of ex.stream(doc, [query])) {
  //         console.log('GOT:', output);
  //       }

  //     } else {
  //       const ffids = await finder.find(page, query, selector);
  //       // console.log('index', index);
  //       // console.log('indexes', indexes);
  //       // console.log('ffids', ffids);
  //       const v = ffids[indexes[index]];
  //       const ffid = v?.ffid;
  //       // console.log('using ffid:', v, ffid);
  //       indexes[index]++;
  //       if (!ffid) {
  //         console.log('No ffid, probably done');
  //         break;
  //       }

  //       const el = await page.locator(`css=[ffid="${ffid}"]`).first();
  //       console.log('EL', el);
  //       switch (action) {
  //         case 'click':
  //           await el.click();
  //           console.log('CLICK!!');
  //           break;
  //         default:
  //           throw new Error(`Unhandled action: ${action}`);
  //       }
  //     }

  //     // await new Promise(ok => setTimeout(ok, 4000));
  //     // throw 'STOP';
  //     // for (const { ffid } of ffids) {
  //     //   console.log('ffid', ffid);
  //     //   const el = await page.locator(`css=[ffid="${ffid}"]`).first();
  //     //   console.log('el', el);
  //     //   switch (action) {
  //     //     case 'click':
  //     //       await el.click();
  //     //       console.log('CLICK!!');
  //     //       break;
  //     //     default:
  //     //       throw new Error(`Unhandled action: ${action}`);
  //     //   }
  //     // }

  //     index++;
  //     if (index >= actions.length) {
  //       index = 0;
  //       await page.goto(url);
  //     }
  //   }


  //   return results;

  //   // for (const page of last) {
  //   //     const content = await page.content();
  //   //     // console.log('FFID CONTENT', content);
  //   //     console.log('ffid', ffid);
  //   //     const newPage = await this.browser.newPage();
  //   //     await newPage.setContent(content);
  //   //     // await newPage.evaluate((ffid) => {
  //   //     //   console.log(123);
  //   //     //   console.log('ffid', ffid);
  //   //     //   alert('123');
  //   //     // }, ffid);
  //   //     const newEl = await newPage.locator(`css=[ffid="${ffid}"]`).first();
  //   //     console.log('newEl', newEl);
  //   //     switch (action) {
  //   //       case 'click':
  //   //         await newEl.click();
  //   //         break;
  //   //       default:
  //   //         throw new Error(`Unhandled action: ${action}`);
  //   //     }
  //   //     // this.head.push(page);
  //   //     console.log('Acted!!');
  //   //     await new Promise(ok => setTimeout(ok, 400000));
  //   //     break;
  //   //   }
  //   //   break;
  //   // }
  //   // await new Promise(ok => setTimeout(ok, 2000));
  //   // throw 'act TODO';
  // }

  async finish() {
    await this.browser.close();
  }
}
