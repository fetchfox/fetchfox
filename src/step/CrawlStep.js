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
      // const all = await this.crawler.all(item.url, this.query);

      console.log('streaming:', stream);

      for await (const link of stream) {
        console.log('yield', link);
        yield Promise.resolve(link);
      }
    }
  }
}
