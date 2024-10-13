import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';
import { Filter } from '../filter/Filter.js';

export const FilterStep = class extends BaseStep {
  static info = BaseStep.combineInfo({
    name: 'filter',
    description: 'Filter results based on a user prompt',
    args: {
      query: {
        description: 'A description of what to filter from.',
        format: 'string',
        example: 'Look only for articles relating to technology and business. Ignore anything written more than a week ago.',
        required: true,
      },
    },
  });

  constructor(args) {
    super(args);

    let query;
    if (typeof args == 'string') {
      this.query = args;
    } else {
      query = args.query;
    }
    if (!query) throw new Error('no query');

    this.query= query;
  }

  async *run(cursor) {
    const filter = new Filter(cursor.ctx);
    const items = cursor.last;
    logger.info(`Filter ${items.length} items for ${this.query}`);
    const stream = filter.run(cursor.last, this.query);
    for await (const match of stream) {
      logger.info(`Filter matched ${match}`);
      yield Promise.resolve(match);
    }
  }
}
