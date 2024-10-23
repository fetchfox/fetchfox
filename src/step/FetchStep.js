import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';
import { Item } from '../item/Item.js';

export const FetchStep = class extends BaseStep {
  constructor(args) {
    super(args);
  }

  async process({ cursor, item }, cb) {
    logger.debug(`Fetch step for ${item}`);
    const doc = await cursor.ctx.fetcher.fetch(item.url);
    cb(new Item({}, doc));
  }
}
