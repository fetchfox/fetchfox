import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';
import { Filter } from '../filter/Filter.js';

export const FilterStep = class extends BaseStep {
  constructor(args) {
    super(args);

    let query;
    if (typeof args == 'string') {
      query = args;
    } else {
      query = args.query;
    }
    if (!query) throw new Error('no query');

    this.query = query;
  }

  async process({ cursor, item }, cb) {
    // TODO: Need a process for processing all items at once,
    // eg. if the users asks something like "take the 10% of items"

    const filter = new Filter(cursor.ctx);
    const stream = filter.run([item], this.query);
    const matches = [];
    logger.debug(`Filter on ${item} on ${this.query}`);


    for await (const output of stream) {
      logger.debug(`Filter matched ${item} on ${this.query}`);
      const done = cb(output);
      if (done) break;
    }
  }
}
