import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';
import { Item } from '../item/Item.js';

export const PageActionStep = class extends BaseStep {
  constructor(args) {
    super(args);

    this.actions = [
      new PageAction(...),
      new PageAction(...),
    ]

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

    // logger.info(`Fetch step for ${item}`);
    // const options = { multiple: true, priority: index };

    // if (this.waitForText) options.waitForText = this.waitForText;
    // if (this.maxPages) options.maxPages = this.maxPages;
    // if (this.active) options.active = this.active;
    // if (this.css) options.css = this.css;

    // const streams = [];
    // for (const field of this.urlFields) {
    //   const url = item[field];
    //   if (!url) continue;
    //   const stream = await cursor.ctx.fetcher.fetch(url, options);
    //   streams.push(stream);
    // }

    // // TODO: race the streams instead of iterating
    // for (const stream of streams) {
    //   for await (const doc of stream) {
    //     logger.info(`Fetch step yielding ${doc}`);
    //     cb(new Item({}, doc));
    //   }
    // }
  }
}
