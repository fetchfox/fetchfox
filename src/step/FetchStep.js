import { logger } from '../log/logger.js';
import { getFetcher } from '../fetch/index.js';
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

  async *run(cursor) {
    for (const item of cursor.last) {
      if (!item.url) {
        logger.warn(`Skipping item without URL: ${item}`);
        continue;
      }

      const { url } = item;
      logger.info(`Fetch URL: ${url}`);
      yield cursor.ctx.fetcher.fetch(url);
    }
  }
}
