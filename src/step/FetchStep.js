import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';
import { Item } from '../item/Item.js';

export const FetchStep = class extends BaseStep {
  constructor(args) {
    super(args);
    this.scroll = args?.scroll;
    this.scrollWait = args?.scrollWait;
  }

  async process({ cursor, item }, cb) {
    logger.debug(`Fetch step for ${item} ${item.actor}`);

    const options = { multiple: true };
    if (this.scroll) {
      options.scroll = this.scroll;
    }
    if (this.scrollWait) {
      options.scrollWait = this.scrollWait;
    }
    if (item.actor) {
      options.actor = item.actor;
    }

    const stream = await cursor.ctx.fetcher.fetch(item.url, options);
    for await (const doc of stream) {
      logger.info(`Fetch step yielding ${doc}`);
      cb(new Item({}, doc));
    }

    // const docs = await cursor.ctx.fetcher.fetch(item.url, options);
    // logger.info(`Fetch step for ${docs.length} documents`);
    // for (const doc of docs) {
    //   logger.info(`Fetch step yielding ${doc}`);
    //   cb(new Item({}, doc));
    // }
  }
}
