import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';

export const UniqueStep = class extends BaseStep {
  constructor(args) {
    if (typeof args == 'string') {
      args = { field: args };
    }
    args.concurrency = 1e6;
    args.intervalCap = 1e6;
    args.interval = 0;

    super(args);

    this.fields = [];
    if (args.field) {
      this.fields.push(args.field);
    }
    if (args.fields) {
      this.fields.push(...args.fields);
    }
  }

  before() {
    this.seen = {};
  }

  async process({ item }, cb) {
    const fields = this.fields || Object.keys(item).sort();
    const val = this.fields.map(f => item[f] || '(not found)').join('_');
    if (this.seen[val]) {
      logger.debug(`Already seen "${fields.join(', ')}"="${val}", skipping ${item}`);
      return;
    }

    logger.debug(`Seeing "${fields.join(', ')}"="${val}" for the first time, using ${item}`);
    this.seen[val] = true;
    cb(item);
  }
}
