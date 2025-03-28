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

    this.query = query;
  }

  async process({ cursor, item, index }, cb) {
    const crawler = cursor.ctx.crawler;

    const options = {
      maxPages: this.maxPages,
      fetchOptions: {
        priority: index,
        instructionsCacheKey: `index-${index}`,
      },
    };

    const url = item.getUrl ? item.getUrl() : (item.url || item._url);

    try {
      for await (const output of crawler.run(url, this.query, options)) {
        if (!output._url) {
          cursor.ctx.logger.error(`No URL found for item ${item}`);
          continue;
        }

        const done = cb(output);
        if (done) break;
      }
    } catch (e) {
      cursor.ctx.logger.error(`${this} Got error: ${e}`);
      throw e;
    }
  }
};
