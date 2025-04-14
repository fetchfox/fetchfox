import { logger as defaultLogger } from '../log/logger.js';
import { getAI } from '../ai/index.js';
import { getFetcher } from '../fetch/index.js';
import { Document } from '../document/Document.js';
import { clip } from '../util.js';

export const BaseCrawler = class {
  constructor(options) {
    const { ai, fetcher, logger, cache } = options || {};
    this.logger = logger || defaultLogger;
    this.ai = ai || getAI(null, options);
    this.fetcher = fetcher || getFetcher(null, options);
    this.cache = cache;

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

  async *getDocs(target, options) {
    if (target instanceof Document) {
      yield Promise.resolve(target);
      return;
    }

    let url;
    if (typeof target == 'string') {
      url = target;
    } else if (target?.url) {
      url = target.url;
    } else if (target?._url) {
      url = target._url;
    } else if (target?._sourceUrl) {
      url = target._sourceUrl;
    }

    try {
      new URL(url);
    } catch(e) {
      this.logger.warn(`${this} Extractor dropping invalid url ${url}: ${e}`);
      url = null;
    }

    if (!url) {
      this.logger.warn(`${this} Could not find extraction target in ${clip(JSON.stringify(target), 400)}`);
      return;
    }

    for await (let doc of this.fetcher.fetch(url, options)) {
      yield Promise.resolve(doc);
    }
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
