import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';
import { Item } from '../item/Item.js';

export const PageActionStep = class extends BaseStep {
  constructor(args) {
    super(args);

    this.actions = [
      new PageAction(...),
      new PageAction(...),
    ];
  }

  async finish(cursor) {
    await cursor.ctx.fetcher.clear();
  }

  async process({ cursor, item, index }, cb) {
    const url = 'https://abc...'; // get url from item....
    const fetcher = cursor.ctx.fetcher;

    const instructions = new FetchInstructions(url, this.actions);

    const stream = fetcher.stream(instructions, maybeSomeOptions);

    for await (const doc of stream) {
      // do one of these
      cb(new Item({}, doc));
      // -- or --
      cb(doc);
    }
  }
}
