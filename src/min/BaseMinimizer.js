import CryptoJS from 'crypto-js';
import { logger } from '../log/logger.js';
import { Document } from '../document/Document.js';

export const BaseMinimizer = class {
  constructor(options) {
    this.cache = (options || {}).cache;
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  cacheKey(doc, options) {
    const hash = CryptoJS
      .SHA256(JSON.stringify({ doc: doc.dump(), options }))
      .toString(CryptoJS.enc.Hex)
      .substr(0, 16);
    return `min-${this.constructor.name}-${doc.url.replace(/\//g, '-').substr(0, 100)}-${hash}`;
  }

  async getCache(doc, options) {
    if (!this.cache) return;
    if (!doc) return;

    const key = this.cacheKey(doc, options);
    const result = await this.cache.get(key);
    const outcome = result ? '(hit)' : '(miss)';
    logger.info(`Minimizer cache ${outcome} for ${doc}`);

    if (!result) return;

    const min = new Document();
    min.loadData(result);
    return min;
  }

  async setCache(doc, options, min) {
    if (!this.cache) return;
    if (!doc) return;

    const key = this.cacheKey(doc, options);
    logger.info(`Set minimizer cache for ${doc}`);
    return this.cache.set(key, min.dump(), 'min');
  }

  async min(doc) {
    const cacheOptions = { removeTags: this.removeTags };
    const cached = await this.getCache(doc, cacheOptions);
    if (cached) return cached;
    if (!doc) return;

    const start = (new Date()).getTime() / 1000;
    const before = JSON.stringify([doc.html, doc.text]).length;

    const min = await this._min(doc);

    const after = JSON.stringify([min.html, min.text]).length;
    const took = (new Date()).getTime() / 1000 - start;
    logger.info(`Minimizing took ${took.toFixed(2)} seconds`);
    logger.info(`Minimized doc from ${before} bytes -> ${after} bytes`);

    this.setCache(doc, cacheOptions, min);

    return min;
  }
}
