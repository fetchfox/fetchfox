import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';

export const CrawlStep = class extends BaseStep {
  static info = BaseStep.combineInfo({
    name: 'crawl',
    description: 'Crawls a URL for links that match a query',
    args: {
      query: {
        description: 'A description of links to look for. Should be specific, and should include exclusions.',
        format: 'string',
        example: 'Look for links to user profile pages. Ignore navigation links, links to posts, and advertisements.',
        required: true,
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

  async process({ cursor, item }, cb) {
    const crawler = cursor.ctx.crawler;
    const url = item.url || item.source().url;
    for await (const output of crawler.run(url, this.query)) {
      if (!url) {
        logger.error(`No URL found for item ${item}`);
        continue;
      }

      const done = cb(output);
      if (done) break;
    }
  }
}
