import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';

export const ConstStep = class extends BaseStep {
  constructor({ items }) {
    super();
    this.items = items;
  }

  async *run(cursor) {
    logger.info(`Running ${this}`);
    for (const item of this.items) {
      logger.info(`Const step giving ${JSON.stringify(item)}`);
      yield Promise.resolve(item);
    }
  }
}
