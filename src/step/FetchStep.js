import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';
import { Item } from '../item/Item.js';

export const FetchStep = class extends BaseStep {
  constructor(args) {
    super(args);
    this.scroll = args?.scroll;
    this.scrollWait = args?.scrollWait;
    this.waitForText = args?.waitForText;
    this.active = args?.active;
  }

  async process({ cursor, item }, cb) {
    logger.info(`Fetch step for ${item}`);

    const options = { multiple: true };
    if (this.scroll) {
      options.scroll = this.scroll;
    }
    if (this.scrollWait) {
      options.scrollWait = this.scrollWait;
    }
    if (this.waitForText) {
      options.waitForText = this.waitForText;
    }
    if (this.active) {
      options.active = this.active;
    }

    if (typeof item.actor == 'function' && item.actor()) {
      logger.debug(`Get actor from item`);
      options.actor = item.actor();
    } else {
      logger.debug(`Get actor from fork`);
      options.actor = await cursor.ctx.actor.fork();
      cursor.defer(() => options.actor.finish());
    }

    const stream = await cursor.ctx.fetcher.fetch(item.url, options);

    for await (const doc of stream) {
      logger.info(`Fetch step yielding ${doc}`);
      cb(new Item({}, doc));
    }
  }
}
