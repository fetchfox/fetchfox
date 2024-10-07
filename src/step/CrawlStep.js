import { logger } from '../log/logger.js';
import { getCrawler } from '../index.js';
import { BaseStep } from './BaseStep.js';

export const CrawlStep = class extends BaseStep {
  constructor(args) {
    super(args);

    let query;
    let crawler;
    if (typeof args == 'string') {
      this.query = args;
    } else {
      crawler = args.crawler;
      query = args.query;
    }

    if (!crawler) this.crawler = getCrawler();
    if (!query) throw new Error('no query');

    this.crawler = crawler;
    this.query= query;
  }

  name() {
    return 'crawl';
  }

  args() {
    return { query: this.query };
  }

  async *run(cursor) {
    for (const item of cursor.last) {
      logger.info(`Crawl ${JSON.stringify(item)} for ${this.query}`);
      const stream = this.crawler.run(item.url, this.query);
      for await (const link of stream) {
        logger.info(`Found link ${link.url}`);
        yield Promise.resolve(link);
      }
    }
  }
}
