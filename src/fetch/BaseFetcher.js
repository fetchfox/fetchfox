import crypto from 'crypto';
import { logger } from '../log/logger.js';
import { Document } from '../document/Document.js';

export const BaseFetcher = class {
  constructor(options) {
    this.cache = options?.cache;
  }

  cacheKey(url, options) {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ url, options }))
      .digest('hex')
      .substr(0, 16);
    return `fetch-${this.constructor.name}-${url.replaceAll(/[^A-Za-z0-9]+/g, '-')}-${hash}`;
  }

  async getCache(url, options) {
    if (!this.cache) return;

    const key = this.cacheKey(url, options);
    const result = await this.cache.get(key);
    const outcome = result ? '(hit)' : '(miss)';
    logger.info(`Fetch cache ${outcome} for ${url} ${result}`);

    if (result) {
      const doc = new Document();
      doc.loadData(result);
      logger.info(`Fetch cache loaded ${doc}`);
      return doc;
    } else {
      return null;
    }
  }

  async setCache(url, options, val) {
    if (!this.cache) return;

    const key = this.cacheKey(url, options);
    logger.info(`Set fetch cache for ${url} to "${('' + val).substr(0, 32)}..."`);
    return this.cache.set(key, val, 'fetch');
  }
}
