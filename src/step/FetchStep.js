import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';

export const FetchStep = class extends BaseStep {
  static info = BaseStep.combineInfo({
    name: 'fetch',
    description: 'Fetch URLs from the web',
    args: {},
  });

  constructor(args) {
    super(args);
  }

  async process({ cursor, item }, cb) {
    logger.verbose(`Fetch step for ${item}`);
    console.log('Fetch!', item.url);
    const doc = await cursor.ctx.fetcher.fetch(item.url);
    // console.log('Got doc: ' + doc);
    cb(doc);
  }
}
