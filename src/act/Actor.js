import playwright from 'playwright';
import puppeteer from 'puppeteer-core';

import fs from 'fs';
import path from 'path';

import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

import { logger } from '../log/logger.js';
import { getAI } from '../ai/index.js';
import { getExtractor } from '../extract/index.js';
import { Document } from '../document/Document.js';
import { Vision } from '../vision/Vision.js';
import { Finder } from './Finder.js';
import { BaseActor } from './BaseActor.js';

export const Actor = class extends BaseActor {
  constructor(options) {
    super(options);
    this.ai = options?.ai || getAI();
    this.extractor = options?.extractor || getExtractor();
    this.vision = new Vision({ ai: this.ai });

    this.browser = options?.browser || 'chromium';
    this.loadWait = options?.loadWait || 1000;
    this.timeoutWait = options?.timeoutWait || 4000;

    this.headless = options?.headless === undefined ? true : options.headless;
    this.cdp = options?.cdp;
    this.options = options?.options || {};

    this.history = [];
    this.index = -1;
  }

  toString() {
    const url = this.url();
    return `[Actor ${this.browser} loadWait=${this.loadWait}]`;
  }

  url() {
    return this.page?.url();
  }

  async doc() {
    logger.debug(`Doc from ${this.url()}, ${this.page}`);
    const doc = new Document();

    const start = (new Date()).getTime();
    const screenshot = await this.page.screenshot({ fullPage: true });
    const took = (new Date()).getTime() - start;
    logger.debug(`Got screenshot in ${took} msec`);

    const [
      html,
      text,
    ] = await Promise.all([
      this.page.content(),
      this.page.evaluate(() => document?.body?.innerText || ''),
    ]);

    const data = {
      url: this.url(),
      screenshot,
      html,
      text,
      contentType: 'text/html',
    };

    doc.loadData(data);
    return doc;
  }

  async replay() {
    const copy = new Actor(this);
    for (const h of this.history) {
      if (h.action == 'start') {
        await copy.start(h);

      } else if (h.action == 'goto') {
        await copy.goto(h.url);

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
    if (!query) {
      return fork;
    }

    const done = await fork.act(action, query, selector);
    this.history = JSON.parse(JSON.stringify(fork.history));
    this.history.pop();
    this.index = fork.index + 1;
    return [fork, done];
  }

  async launch() {
    logger.info(`Actor launching ${this.browser}`);

    let p;
    if (this.cdp) {
      logger.debug(`Actor using CDP endpoint ${this.cdp}`);
      p = chromium.connectOverCDP(this.cdp);
    } else {
      logger.debug(`Actor using local Chromium`);
      p = chromium.launch({ ...this.options, headless: this.headless });
    }

    return p;

    // const url = 'https://www.united.com/en/us/fsr/choose-flights?f=SJC&t=NEW%20YORK%2C%20NY%2C%20US%20(ALL%20AIRPORTS)&d=2025-01-10&tt=1&sc=7&px=1&taxng=1&newHP=True&clm=7&st=bestmatches&tqp=R';
    // const bd = 'wss://brd-customer-hl_e9028181-zone-scraping_browser1:96m97ovmklqe@brd.superproxy.io:9222';
    // console.log('connect bd', bd);

    // let page;

    // if (false) {
    //   const browser = await puppeteer.connect({ browserWSEndpoint: bd });
    //   page = await browser.newPage();
    //   await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    // } else {
    //   const browser = await chromium.connectOverCDP(bd);
    //   page = await browser.newPage();
    //   await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    // }

    // console.log('sleep');
    // await new Promise(ok => setTimeout(ok, 10 * 1000));
    // console.log('done sleeping');

    // console.log('screenshot');
    // // await page.screenshot({ path: '/tmp/out.png', fullPage: true });
    // await page.screenshot({ path: '/tmp/out.png' });
    // const html = await page.content();
    // console.log('html');
    // fs.writeFileSync('/tmp/out.html', html);

    // throw new Error('STOP');

    // // const page = await browser.newPage();
    // // await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    // return await playwright.chromium.connectOverCDP(bd);


    // const proxy = {
    //   // liveproxies.io
    //   // server: '174.138.165.234:7383',
    //   // username: 'LV39510938-L66tFsxSSM-40',
    //   // password: '5XADCUQz4fTrxJSSkDEN',

    //   // ninjasproxy.com
    //   server: '109.238.174.145:13228',
    //   username: 'ninja1358446',
    //   password: '8zH9h5XjddNQE@',
    // };

    // return chromium.launch({
    //   headless: false,
    //   // proxy,
    // });
    // // return chromium.launch({ ...this.options, headless: this.headless });
    // // return playwright[this.browser].launch({ ...this.options, headless: this.headless });
  }

  async start() {
    logger.trace(`Actor starting`);

    if (this._browser) throw new Error('Double browser launch');

    this._browser = await this.launch();
    this._browser.on('page', async (p) => {
      await p.waitForLoadState();
      this.url = p.url();
    });

    this.index = 0;
    this.history = [{ action: 'start' }];

    this.page = await this._browser.newPage();
  }

  finder(query, selector) {
    return new Finder(this.ai, this.page, query, selector);
  }

  async *scrollForDocs(num, scrollWait) {
    for (let i = 0; i < num; i++) {
      const wait = scrollWait || 1000;
      logger.debug(`Wait for ${wait} and then scroll and get doc`);
      await new Promise(ok => setTimeout(ok, wait));
      await this.page.keyboard.press('PageDown');
      logger.debug(`Pressed page down, get doc on ${this.page}`);
      yield this.doc();
    }
  }

  async goto(url, checkForReady) {
    logger.info(`Actor goto ${url}, checkForReady=${checkForReady}`);

    if (!this._browser) {
      await this.start();
    }

    if (!this._browser) throw new Error('No browser');
    if (!this.page) throw new Error('No page');

    this.index++;
    this.history.push({ action: 'goto', url });

    if (this.page.url() == url) {
      logger.info(`Actor page already on ${url}, not calling goto again`);

    } else {
      logger.debug(`Actor go to ${url} with timeout ${this.timeoutWait} secs`);
      try {
        await this.page.goto(url, { timeout: this.timeoutWait });
      } catch (e) {
        if (e.name != 'TimeoutError') throw e;
        logger.warn(`Actor continuing after timeout on ${url}`);
      }

      logger.debug(`Actor waiting ${this.loadWait} secs for load`);
      await new Promise(ok => setTimeout(ok, this.loadWait));
      logger.debug(`Done waiting`);

      // const html = await this.page.content();
      // console.log('html', html);

      // await this.page.screenshot({ path: '/tmp/out.png', fullPage: true });
      await this.page.screenshot({ path: '/tmp/out.png' });
      const html = await this.page.content();
      fs.writeFileSync('/tmp/out.html', html);

      // throw 'XYZ';
    }

    if (checkForReady) {
      return await this._checkReady();
    } else {
      return true;
    }
  }

  async _checkReady() {
    // TODO: actually check for ready using AI. For now just sleeping a bit.
    await new Promise(ok => setTimeout(ok, 5000));
  }

  async login(username, password) {
    const [
      usernameLocs,
      passwordLocs,
    ] = await Promise.all([
      this.finder('username/email field', 'input').all(),
      this.finder('password field', 'input').all(),
    ]);
    await usernameLocs[0].type(username);
    await passwordLocs[0].type(password);
    await new Promise(ok => setTimeout(ok, 200));
    await passwordLocs[0].press('Enter');

    await this._checkReady();
  }

  async act(action, query, selector) {
    logger.debug(`Acting ${action} for ${query} matching ${selector} on ${this.url()}`);
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
    logger.debug(`Actor doing ${action} on ${el}`);
    switch (action) {
      case 'click':
        await el.click();

        // TODO: better solution than this heuristic
        await new Promise(ok => setTimeout(ok, 500));

        break;

      case 'login':
        await this.login();
        break;

      default:
        throw new Error(`Unhandled action: ${action}`);
    }
  }

  async finish() {
    if (this._browser) {
      await this._browser.close();
      this._browser = null;
    }
  }
}
