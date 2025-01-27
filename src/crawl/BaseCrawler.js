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

    this.signal = options?.signal;
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  async all(url, query, options) {
    options = { ...options, stream: false };
    let result = [];
    for await (const r of this.run(url, query, options)) {
      result.push(r);
    }
    return result;
  }

  async one(url, query, options) {
    options = { ...options, stream: true };
    for await (const r of this.run(url, query, options)) {
      return r;
    }
  }

  async *stream(url, query, options) {
    options = { ...options, stream: true };
    for await (const r of this.run(url, query, options)) {
      yield Promise.resolve(r);
    }
  }
};
