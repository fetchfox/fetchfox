import crypto from 'crypto';
import fetch from 'node-fetch';
import { logger } from '../log/logger.js';
import { Document } from '../document/Document.js';
import { BaseFetcher } from './BaseFetcher.js';

export const Fetcher = class extends BaseFetcher {
  constructor(options) {
    super(options);
  }

  async fetch(url, options) {
    logger.info(`Fetch ${url} with options ${options || '(none)'}`);

    try {
      new URL(url);
    } catch (e) {
      return null;
    }

    if (url.indexOf('javascript:') == 0) {
      return null;
    }

    const cached = await this.getCache(url, options);
    if (cached) {
      logger.info(`Returning cached ${cached}`);
      return cached;
    }

    const doc = new Document();
    const resp = await fetch(url, options);
    logger.info(`Got response: ${resp.status} for ${resp.url}`);
    await doc.read(resp, url, options);

    this.setCache(url, options, doc.dump());

    return doc;
  }
}
