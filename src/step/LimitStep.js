import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';

export const LimitStep = class extends BaseStep {
  constructor(args) {
    super(args);
  }

  async process({ cursor, item }, cb) {
    logger.info(`Limit step on ${item}`);
    cb(item);
  }
}
