import { logger } from '../log/logger.js';
import { getCrawler } from '../index.js';
import { BaseStep } from './BaseStep.js';

export const CrawlStep = class extends BaseStep {
  constructor(args) {
    super();

    if (typeof args == 'string') {
      this.crawler = getCrawler();
      this.query = args;
    } else {
      const { crawler, query } = args;
      this.crawler = crawler;
      this.query = query;
    }
  }

  async *run(cursor) {
    for (const item of cursor.head) {
      logger.info(`Crawl ${JSON.stringify(item)} for ${this.query}`);
      const stream = this.crawler.run(item.url, this.query);
      for await (const link of stream) {
        logger.info(`Found link ${link.url}`);
        yield Promise.resolve(link);
      }
    }
  }
}
