import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';

export const LimitStep = class extends BaseStep {
  static info = BaseStep.combineInfo({
    name: 'limit',
    description: 'Limit the number of results',
    args: {},
  });

  constructor(args) {
    super(args);
  }
}
