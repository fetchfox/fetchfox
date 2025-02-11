import fetch from 'node-fetch';
import { logger } from '../log/logger.js';
import { Document } from '../document/Document.js';
import { BaseFetcher } from './BaseFetcher.js';

export const Fetcher = class extends BaseFetcher {
  constructor(options) {
    super(options);
  }

  async goto(url) {
    return { url };
  }

  async current(ctx) {
    const url = ctx.url;
    const doc = new Document();
    let resp;
    try {
      resp = await fetch(url, { signal: this.signal });
    } catch (e) {
      if (e.name == 'AbortError') {
        logger.warn(`${this} Aborted fetch`);
        return;
      }
      logger.error(`${this} Caught exception: ${e}`);
      throw e;
    }

    logger.info(`Got response: ${resp.status} for ${resp.url}`);
    await doc.read(resp, url);
    return doc;
  }
}
