import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';

export const LimitStep = class extends BaseStep {
  static info = BaseStep.combineInfo({
    // All steps have `limit`, so AI will not need it
    hideFromAI: true,

    name: 'limit',
    description: 'Limit the number of results',
    args: {},
  });

  constructor(args) {
    super(args);
  }

  async process({ cursor, item }, cb) {
    cb(item);
  }
}
