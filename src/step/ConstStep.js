import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';

export const ConstStep = class extends BaseStep {
  static info = {
    name: 'const',
    description: 'Add a constant item, typically used to initialize the starting URL',
    args: {
      items: {
        description: 'An object to add. Format: array of objects',
        example: [{ url: 'https://example.com' }],
      },
    },
  };

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

  args() {
    return { items: this.items };
  }

  async *run(cursor) {
    logger.info(`Running ${this}`);
    for (const item of this.items) {
      logger.info(`Const step giving ${JSON.stringify(item)}`);
      yield Promise.resolve(item);
    }
  }
}
