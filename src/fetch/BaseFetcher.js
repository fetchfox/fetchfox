import CryptoJS from 'crypto-js';
import { logger } from '../log/logger.js';
import { Document } from '../document/Document.js';

export const BaseFetcher = class {
  constructor(options) {
    this.cache = options?.cache;
    this.sleepTime = 500;
    this.waiting = null;
    this.queue = [];
  }

  async ready() {
    if (!this.waiting) {
      this.waiting = new Promise((ok) => {
        setTimeout(ok, this.sleepTime);
      });
    } else {
      const p = this.waiting.then(() => {
        return new Promise((ok) => {
          setTimeout(ok, this.sleepTime);
        });
      });
      this.waiting = p;
    }

    return this.waiting;
  }

  async fetch(url, options) {
    const cached = await this.getCache(url, options);
    if (cached) {
      logger.debug(`Returning cached ${cached}`);
      return cached;
    }

    await this.ready();

    try {
      new URL(url);
    } catch (e) {
      return null;
    }

    const exclude = ['javascript:', 'mailto:'];
    for (const e of exclude) {
      if (url.indexOf(e) == 0) {
        return null;
      }
    }

    const doc = await this._fetch(url, options);

    this.setCache(url, options, doc.dump());

    return doc;
  }

  cacheKey(url, options) {
    const hash = CryptoJS
      .SHA256(JSON.stringify({ url, options }))
      .toString(CryptoJS.enc.Hex)
      .substr(0, 16);
    return `fetch-${this.constructor.name}-${url.replaceAll(/[^A-Za-z0-9]+/g, '-')}-${hash}`;
  }

  async getCache(url, options) {
    if (!this.cache) return;

    const key = this.cacheKey(url, options);
    const result = await this.cache.get(key);
    const outcome = result ? '(hit)' : '(miss)';
    logger.debug(`Fetch cache ${outcome} for ${url} ${result}`);

    if (result) {
      const doc = new Document();
      doc.loadData(result);
      logger.debug(`Fetch cache loaded ${doc}`);
      return doc;
    } else {
      return null;
    }
  }

  async setCache(url, options, val) {
    if (!this.cache) return;

    const key = this.cacheKey(url, options);
    logger.debug(`Set fetch cache for ${url} to "${('' + val).substr(0, 32)}..."`);
    return this.cache.set(key, val, 'fetch');
  }
}
