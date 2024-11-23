import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';
import { Item } from '../item/Item.js';

export const FetchStep = class extends BaseStep {
  constructor(args) {
    super(args);
    this.urlFields = args?.urlFields || ['url'];
    this.scroll = args?.scroll;
    this.scrollWait = args?.scrollWait;
    this.waitForText = args?.waitForText;
    this.active = args?.active;
    this.css = args?.css;
  }

  async process({ cursor, item }, cb) {
    logger.info(`Fetch step for ${item}`);
    const options = { multiple: true };

    if (this.scroll) options.scroll = this.scroll;
    if (this.scrollWait) options.scrollWait = this.scrollWait;
    if (this.waitForText) options.waitForText = this.waitForText;
    if (this.active) options.active = this.active;
    if (this.css) options.css = this.css;

    const streams = [];
    for (const field of this.urlFields) {
      const stream = await cursor.ctx.fetcher.fetch(item[field], options);
      streams.push(stream);
    }

    // TODO: race the streams instead of iterating
    for (const stream of streams) {
      for await (const doc of stream) {
        logger.info(`Fetch step yielding ${doc}`);
        cb(new Item({}, doc));
      }
    }
  }
}
