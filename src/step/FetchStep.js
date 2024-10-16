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

  async *runItem(cursor, item) {
    if (!item.url) {
      logger.warn(`Skipping item without URL: ${item}`);
      return;
    }

    const { url } = item;
    logger.verbose(`Fetch URL: ${url}`);
    yield cursor.ctx.fetcher.fetch(url);
  }
}
