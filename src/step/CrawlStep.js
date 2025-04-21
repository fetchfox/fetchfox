import { logger } from  '../log/logger.js';
import { BaseStep } from './BaseStep.js';
import { Document } from '../document/Document.js';
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

    this.query = query;
    this.pull = args?.pull;
    this.suggestions = args?.suggestions;
    this.maxIterations = args?.maxIterations || 20;
  }

  async process({ cursor, item, index }, cb) {
    const crawler = cursor.ctx.crawler;

    const options = {
      maxPages: this.maxPages,
      pull: this.pull,
      suggestions: this.suggestions,
      maxIterations: this.maxIterations,
      fetchOptions: {
        priority: index,
        instructionsCacheKey: `index-${index}`,
      },
    };

    const url = item.getUrl ? item.getUrl() : (item.url || item._url);
    const seen = {};

    try {
      for await (const output of crawler.run(url, this.query, options)) {
        const url = output._url || output.url;
        if (url) {
          cursor.ctx.logger.error(`No URL found for item ${item}: ${clip(JSON.stringify(output), 1000)}`);
          continue;
        }
        if (seen[url]) {
          continue;
        }
        seen[url] = true;

        let result = {};
        if (typeof item == 'object' && !item instanceof Document) {
          result = { ...item };
        }
        result = { ...result, ...output };

        const done = cb(result);
        if (done) break;
      }
    } catch (e) {
      cursor.ctx.logger.error(`${this} Got error: ${e}`);
      throw e;
    }
  }
};
