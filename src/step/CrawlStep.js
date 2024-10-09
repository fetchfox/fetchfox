import { logger } from '../log/logger.js';
import { getCrawler } from '../index.js';
import { BaseStep } from './BaseStep.js';

export const CrawlStep = class extends BaseStep {
  static info = BaseStep.combineInfo({
    name: 'crawl',
    description: 'Crawls a URL for links that match a query',
    args: {
      query: {
        description: 'A description of links to look for. Should be specific, and should include exclusions. Format: string',
        example: 'Look for links to user profile pages. Ignore navigation links, links to posts, and advertisements.'
      },
      limit: {
        description: 'Limit the number of results in this step. Format: Number',
        example: 5,
      },
    },
  });

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

  args() {
    return super.args({ query: this.query });
  }

  async *run(cursor) {
    for (const item of cursor.last) {
      logger.info(`Crawl ${JSON.stringify(item)} for ${this.query}`);
      const stream = cursor.ctx.crawler.run(item.url, this.query);
      for await (const link of stream) {
        logger.info(`Found link ${link.url}`);
        yield Promise.resolve(link);
      }
    }
  }
}
