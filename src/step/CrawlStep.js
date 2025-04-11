import { logger } from  '../log/logger.js';
import { BaseStep } from './BaseStep.js';
import { clip } from '../util.js';

export const CrawlStep = class extends BaseStep {
  constructor(args) {
    super(args);

    let query;
    if (typeof args == 'string') {
      this.query = args;
    } else {
      query = args?.query;
    }

    console.log('args', args);
    logger.trace('.');

    this.query = query;
    this.pull = args?.pull;
    this.suggestions = args?.suggestions;
  }

  async process({ cursor, item, index }, cb) {
    const crawler = cursor.ctx.crawler;

    const options = {
      maxPages: this.maxPages,
      pull: this.pull,
      suggestions: this.suggestions,
      fetchOptions: {
        priority: index,
        instructionsCacheKey: `index-${index}`,
      },
    };

    const url = item.getUrl ? item.getUrl() : (item.url || item._url);

    try {
      for await (const output of crawler.run(url, this.query, options)) {
        if (!output._url && !output.url) {
          cursor.ctx.logger.error(`No URL found for item ${item}: ${clip(JSON.stringify(output), 1000)}`);
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
