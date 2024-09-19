import crypto from 'crypto';
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
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ doc: doc.dump(), options }))
      .digest('hex')
      .substr(0, 16);
    return `min-${this.constructor.name}-${doc.url.replace(/\//g, '-').substr(0, 100)}-${hash}`;
  }

  async getCache(doc, options) {
    if (!this.cache) return;

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

    const key = this.cacheKey(doc, options);
    logger.info(`Set minimizer cache for ${doc}`);
    return this.cache.set(key, min.dump(), 'min');
  }
}
