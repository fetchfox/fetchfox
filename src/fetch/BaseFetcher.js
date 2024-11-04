import CryptoJS from 'crypto-js';
import { logger } from '../log/logger.js';
import { Document } from '../document/Document.js';
import PQueue from 'p-queue';

let waiting = null;

let waiting = null;

export const BaseFetcher = class {
  constructor(options) {
    this.cache = options?.cache;
    this.queue = [];
    this.usage = {
      requests: 0,
      cached: 0,
      runtime: 0,
    };
    this.q = new PQueue({
      concurrency: options?.concurrency || 5,
      intervalCap: options?.intervalCap || 3,
      interval: options?.interval || 3000,
    });
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  async fetch(url, options) {
    this.usage.requests++;
    const start = (new Date()).getTime();

    try {
      const cached = await this.getCache(url, options);
      if (cached) {
        logger.debug(`Returning cached ${cached}`);
        this.usage.cached++;
        return cached;
      }

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

      logger.debug(`Adding ${url} to fetch queue`);
      const p = await this.q.add(() => {
        logger.debug(`Queue is starting fetch of ${url}`);
        return this._fetch(url, options);
      });
      logger.debug(`Fetch queue has ${this.q.size} requests`);
      const doc = await p;

      // TODO: option to cache null/bad responses
      if (doc) this.setCache(url, options, doc.dump());

      return doc;
    } finally {
      const took = (new Date()).getTime() - start;
      this.usage.runtime += took;
    }
  }

  cacheKey(url, options) {
    const hash = CryptoJS
      .SHA256(JSON.stringify({ url, options }))
      .toString(CryptoJS.enc.Hex)
      .substr(0, 16);
    return `fetch-${this.constructor.name}-${url.replaceAll(/[^A-Za-z0-9]+/g, '-').substr(0, 120)}-${hash}`;
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
