import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';

export const CrawlStep = class extends BaseStep {
  constructor({ crawler, query }) {
    super();
    this.crawler = crawler;
    this.query = query;
  }

  async *run(cursor) {
    for (const item of cursor.head) {
      logger.info(`Crawl ${item} for ${this.query}`);
      const stream = this.crawler.run(item.url, this.query);
      for await (const link of stream) {
        logger.info(`Found link ${link.url}`);
        yield Promise.resolve(link);
      }
    }
  }
}
