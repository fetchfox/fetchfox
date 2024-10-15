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
  }
}
