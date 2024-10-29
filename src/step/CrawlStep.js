import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';

export const CrawlStep = class extends BaseStep {
  constructor(args) {
    super(args);

    let query;
    if (typeof args == 'string') {
      this.query = args;
    } else {
      query = args.query;
    }
    if (!query) throw new Error('no query');

    this.query= query;
  }

  async process({ cursor, item }, cb) {
    const crawler = cursor.ctx.crawler;
    const start = (new Date()).getTime();

    const url = item.url || item.source().url;
    for await (const output of crawler.run(url, this.query)) {
      if (!output.url) {
        logger.error(`No URL found for item ${item}`);
        continue;
      }

      const took = (new Date()).getTime() - start;
      logger.debug(`Crawl took ${took/1000} sec so far`);
      const done = cb(output);
      if (done) break;
    }
  }
}
