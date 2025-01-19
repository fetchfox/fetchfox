import { DeepCrawler } from '../crawl/DeepCrawler/DeepCrawler.js';
import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';

export class DeepCrawlStep extends BaseStep {
  constructor(args) {
    super(args);

    this.query = typeof args == 'string' ? args : args.query;
    if (!this.query) throw new Error('no query');
  }

  async process({ cursor, item, index }, cb) {
    const originalCrawler = cursor.ctx.crawler;
    const crawler = new DeepCrawler({ ai: originalCrawler.ai, fetcher: originalCrawler.fetcher });
    const start = new Date().getTime();

    const options = {
      maxPages: this.maxPages,
      fetchOptions: { priority: index },
    };

    // TODO: modular/intelligent selection of URL field
    const url = item._url || item._sourceUrl();

    try {
      for await (const output of crawler.run(url, this.query, options)) {
        if (!output._url) {
          logger.error(`No URL found for item ${item}`);
          continue;
        }

        const took = new Date().getTime() - start;
        logger.debug(`Crawl took ${took / 1000} sec so far`);
        const done = cb(output);
        if (done) break;
      }
    } catch (e) {
      logger.error(`${this} Got error: ${e}`);
      throw e;
    }
  }
}
