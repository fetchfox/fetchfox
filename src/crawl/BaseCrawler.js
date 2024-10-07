import { DefaultFetcher } from '../fetch/index.js';
import { getAI } from '../ai/index.js';

export const BaseCrawler = class {
  constructor(options) {
    const { ai, fetcher, cache } = Object.assign({}, options);
    this.ai = getAI(ai, { cache });
    this.fetcher = fetcher || new DefaultFetcher({ cache });
  }
}
