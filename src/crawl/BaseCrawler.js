import { getAI } from '../ai/index.js';
import { getFetcher } from '../fetch/index.js';

export const BaseCrawler = class {
  constructor(options) {
    const { ai, fetcher, cache } = options || {};
    this.ai = getAI(ai, { cache });
    this.fetcher = fetcher || getFetcher(null, { cache });
    this.usage = {
      requests: 0,
      count: 0,
      runtime: 0,
    };
  }
}
