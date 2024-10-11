import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';

export const ConstStep = class extends BaseStep {
  static info = BaseStep.combineInfo({
    name: 'const',
    description: 'Add a constant item, typically used to initialize the starting URL',
    args: {
      items: {
        description: 'An array of objects to add.',
        format: 'array',
        example: [{ url: 'https://example.com' }],
        required: true,
      },
    },
  });

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

  async *run(cursor) {
    logger.info(`Running ${this}`);
    for (const item of this.items) {
      logger.info(`Const step giving ${JSON.stringify(item)}`);
      yield Promise.resolve(item);
    }
  }
}
