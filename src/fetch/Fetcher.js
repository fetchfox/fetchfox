import fetch from 'node-fetch';
import { logger } from '../log/logger.js';
import { Document } from '../document/Document.js';
import { BaseFetcher } from './BaseFetcher.js';

export const Fetcher = class extends BaseFetcher {
  constructor(options) {
    super(options);
  }

  async *_fetch(url, options) {
    const doc = new Document();
    const resp = await fetch(url, options);
    logger.info(`Got response: ${resp.status} for ${resp.url}`);
    await doc.read(resp, url, options);
    yield Promise.resolve(doc);
  }
};
