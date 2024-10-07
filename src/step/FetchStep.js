import { logger } from '../log/logger.js';
import { getFetcher } from '../index.js';
import { BaseStep } from './BaseStep.js';

export const FetchStep = class extends BaseStep {
  constructor(args) {
    super(args);

    if (typeof args?.fetch == 'function') {
      this.fetcher = args;
    } else if (typeof args == 'string') {
      this.fetcher = getFetcher(args);
    } else if (args.fetcher) {
      this.fetcher = args.fetcher;
    } else {
      this.fetcher = getFetcher();
    }
  }

  async *run(cursor) {
    for (const item of cursor.last) {
      if (!item.url) {
        logger.warn(`Skipping item without URL: ${item}`);
        continue;
      }

      const { url } = item;
      logger.info(`Fetch URL: ${url}`);
      yield this.fetcher.fetch(url);
    }
  }
}
