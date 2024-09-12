import crypto from 'crypto';
import fetch from 'node-fetch';
import { logger } from '../log/logger.js';
import { Document } from '../document/Document.js';

export const Fetcher = class {
  constructor({ cache }) {
    if (cache) this.cache = cache;
  }

  async fetch(url, options) {
    logger.info(`Fetch ${url} with options ${options || '(none)'}`);
    const doc = new Document();
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ url, options }))
      .digest('hex')
      .substr(0, 16);
    const key = `fetch-${url.replaceAll(/[^A-Za-z0-9]+/g, '-')}-${hash}`;
    const cached = this.cache && await this.cache.get(key);
    if (cached) {
      logger.info(`Cache hit for ${url} with key ${key}`);
      doc.loadData(cached);
      return doc;
    }

    const resp = await fetch(url, options);
    logger.info(`Got response: ${resp.status} for ${resp.url}`);
    await doc.read(resp, url, options);

    if (this.cache) {
      logger.info(`Caching ${doc} with key ${key}`);
      this.cache.set(key, doc.dump(), 'fetch');
    }

    return doc;
  }
}
