import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';
import { Item } from '../item/Item.js';

export const ConstStep = class extends BaseStep {
  constructor(args) {
    super(args);

    if (typeof args == 'string') {
      if (args.match(/^https?:\/\//)) {
        this.items = [{ url: args }];
      } else {
        this.items = [{ data: args }];
      }
    } else {
      const { items } = args;
      this.items = items;
    }
  }

  async run(cursor, parent, index) {
    logger.debug(`${this} Run const special case`);

    for (const data of this.items) {
      const copy = { ...data };
      if (copy.url) {
        copy._url = copy.url;
        delete copy.url;
      }
      const output = new Item(copy);
      cursor.publish(null, output, index);
      this.trigger('item', output);
    }
    cursor.finish(index);
    this.trigger('done');
  }
}
