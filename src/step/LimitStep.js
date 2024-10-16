import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';

export const LimitStep = class extends BaseStep {
  static info = BaseStep.combineInfo({
    name: 'limit',
    description: 'Limit the number of items that continue to following steps',
    args: {
      limit: {
        description: 'Number of items to limit to',
        format: 'number',
        example: 5,
        required: true,
      },
    },
  });

  constructor(args) {
    super(args);
    this.count = null;
  }

  before() {
    this.count = 0;
  }

  async *runItem(cursor, item) {
    logger.verbose(`Limit to ${this.limit} items, count is ${this.count}`);

    this.count++
    if (this.count > this.limit) {
      throw { code: 'limit' };
    }

    yield Promise.resolve(item);
  }

  async finish() {
    this.count = null;
  }
}
