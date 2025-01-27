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
    const crawler = new DeepCrawler({ ai: cursor.ctx.ai, fetcher: cursor.ctx.fetcher });

    const options = {
      maxPages: this.maxPages,
      fetchOptions: { priority: index },
      signal: cursor.ctx.signal,
    };

    const url = item.getUrl();

    try {
      for await (const output of crawler.run(url, this.query, options)) {
        if (!output._url) {
          logger.error(`No URL found for item ${item}`);
          continue;
        }

        const done = cb(output);
        if (done) break;
      }
    } catch (e) {
      logger.error(`${this} Got error: ${e}`);
      throw e;
    }
  }
}
