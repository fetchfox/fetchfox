import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';

export const FetchStep = class extends BaseStep {
  constructor(args) {
    super(args);
    this.waitForText = args?.waitForText;
    this.active = args?.active;
    this.css = args?.css;
    this.maxPages = args?.maxPages || 5;
  }

  async finish(cursor) {
    await cursor.ctx.fetcher.clear();
  }

  async process({ cursor, item, index }, cb) {
    logger.info(`Fetch step for ${item}`);
    const options = { multiple: true, priority: index };

    if (this.waitForText) options.waitForText = this.waitForText;
    if (this.maxPages) options.maxPages = this.maxPages;
    if (this.active) options.active = this.active;
    if (this.css) options.css = this.css;
    if (this.hint) options.hint = this.hint;

    const url = item.url || item._url;
    const stream = await cursor.ctx.fetcher.fetch(url, options);
    for await (const doc of stream) {
      logger.info(`Fetch step yielding ${doc}`);
      const done = cb(doc);
      if (done) {
        break;
      }
    }
  }
}
