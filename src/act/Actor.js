import playwright from 'playwright';
import { DiffDOM, nodeToObj, stringToObj } from "diff-dom"

import pretty from 'pretty';
import * as diff from 'diff';

import { logger } from '../log/logger.js';
import { getAI } from '../ai/index.js';
import { getExtractor } from '../extract/index.js';
import { Document } from '../document/Document.js';
import { Vision } from '../vision/Vision.js';
import { Finder } from './Finder.js';
import { BaseActor } from './BaseActor.js';

export const Actor = class extends BaseActor {
  constructor(options) {
    console.log('make actor from', options);

    super(options);
    this.ai = options?.ai || getAI();
    this.extractor = options?.extractor || getExtractor();
    this.vision = new Vision({ ai: this.ai });

    this.headless = options?.headless === undefined ? true : options.headless;
    this.browser = options?.browser || 'chromium';
    this.loadWait = options?.loadWait || 1000;
    this.timeoutWait = options?.timeoutWait || 4000;

    this.history = [];
    this.index = -1;

    logger.trace('???');
  }

  toString() {
    const url = this.url();
    return `[Actor ${this.browser} loadWait=${this.loadWait}]`;
  }

  url() {
    return this.page?.url();
  }

  async doc() {
    logger.debug(`Doc from ${this.url()}`);
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
    logger.debug(`Actor launching ${this.browser}`);
    return playwright[this.browser].launch({ headless: this.headless });
  }

  async start(url) {
    if (this._browser) throw new Error('Double browser launch');

    this._browser = await this.launch();
    this._browser.on('page', async (p) => {
      await p.waitForLoadState();
      this.url = p.url();
    });

    this.page = await this._browser.newPage();
    await this.goto(url);

    this.index = 0;
    this.history = [{ action: 'start', url }];

    console.log('start done');
  }

  finder(query, selector) {
    return new Finder(this.ai, this.page, query, selector);
  }


  async *scrollForDocs(num, scrollWait) {
    for (let i = 0; i < num; i++) {
      const wait = scrollWait || this.loadWait;
      logger.debug(`Wait for ${wait} and then scroll and get doc`);
      await new Promise(ok => setTimeout(ok, wait));
      await this.page.keyboard.press('PageDown');
      yield this.doc();
    }
  }

  async goto(url, checkForReady) {
    if (!this._browser) throw new Error('No browser');
    if (!this.page) throw new Error('No page');

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
    }

    if (checkForReady) {
      return await this._checkReady(5, 1000);
    } else {
      return true;
    }
  }

  async _checkReady(maxTries, sleepTime) {

    // TODO: actuall check for ready... for now just sleeping a bit
    await new Promise(ok => setTimeout(ok, 5000));

    // for (let i = 0; i < maxTries; i++) {
    //   const vReady = await this._visionCheckReady();
    //   if (vReady) return true;
    //   await new Promise(ok => setTimeout(ok, sleepTime));
    // }
    // return false;
  }

  // async _visionCheckReady() {
  //   await this.page.screenshot({ path: '/tmp/ss.png', fullPage: true });
  //   const buf = await this.page.screenshot({ fullPage: true });
  //   const answer = await this.vision.askIsLoading(buf);
  //   return answer.readyState == 'fully-ready';
  // }

  async login(username, password) {
    const [
      usernameLocs,
      passwordLocs,
    ] = await Promise.all([
      this.finder('username/email field', 'input').all(),
      this.finder('password field', 'input').all(),
    ]);
      
    console.log('username', usernameLocs);
    console.log('password', passwordLocs);

    await usernameLocs[0].type(username);
    await passwordLocs[0].type(password);
    await new Promise(ok => setTimeout(ok, 200));
    await passwordLocs[0].press('Enter');

    const ready = await this._checkReady(5, 4000);

    if (ready) {
      logger.info(`Vision checks say page is ready`);
    } else {
      logger.warn(`Vision checks did not find the page ready`);
    }

    return ready;
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
