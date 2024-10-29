import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';

export const UniqueStep = class extends BaseStep {
  constructor(args) {
    super(args);

    this.fields = [];

    if (args.field) {
      this.fields.push(args.field);
    }
    if (args.fields) {
      this.fields.push(...args.fields);
    }

    if (!this.fields.length && args) {
      if (typeof args == 'string') {
        this.fields = [args];
      } else if (
        Array.isArray(args) &&
        args.filter(x => typeof x == 'string').length == args.length)
      {
        this.fields = args;
      }
    }
  }

  before() {
    this.seen = {};
  }

  async process({ cursor, item }, cb) {
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
