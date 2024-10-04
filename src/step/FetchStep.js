import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';

export const FetchStep = class extends BaseStep {
  constructor({ fetcher }) {
    super();
    this.fetcher = fetcher;
  }

  async *run(cursor) {
    for (const item of cursor.head) {
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
