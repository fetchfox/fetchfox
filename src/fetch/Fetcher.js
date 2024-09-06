import fetch from 'node-fetch';
import { logger } from '../log/logger.js';
import { Document } from '../document/Document.js';

export const Fetcher = class {
  constructor() { }

  async fetch(url, options) {
    logger.info(`Fetch ${url} with options ${options || '(none)'}`);
    const resp = await fetch(url, options);
    logger.info(`Got response: ${resp.status} for ${resp.url}`);
    const doc = new Document();
    await doc.read(resp, url, options);
    return doc;
  }
}
