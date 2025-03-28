import { BaseStep } from './BaseStep.js';

export const LimitStep = class extends BaseStep {
  constructor(args) {
    args.concurrency = 1e6;
    args.intervalCap = 1e6;
    args.interval = 0;
    super(args);
  }

  async process({ cursor, item }, cb) {
    cursor.ctx.logger.debug(`Limit step on ${JSON.stringify(item).substr(0, 100)}`);
    cb(item);
  }
}
