import { logger } from '../log/logger.js';
import { getAI } from '../ai/index.js';
import { getFetcher } from '../fetch/index.js';
import { getMinimizer } from '../min/index.js';
import { Document } from '../document/Document.js';

export const BaseExtractor = class {
  constructor(options) {
    const { ai, fetcher, minimizer, signal, cache, hardCapTokens } = options || {};
    this.signal = signal;
    this.cache = cache;
    this.ai = getAI(ai, { cache, signal });
    this.fetcher = getFetcher(fetcher, { cache, signal });
    this.minimizer = getMinimizer(minimizer, { cache });
    this.hardCapTokens = hardCapTokens || 1e7;
    this.usage = {
      requests: 0,
      runtime: 0,
    };
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  async clear() {
    logger.info(`${this} clear associated fetch queue`);
    this.fetcher.clear();
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
      logger.warn(`${this} Extractor dropping invalid url ${url}: ${e}`);
      url = null;
    }

    if (!url) {
      logger.warn(`${this} Could not find extraction target in ${target}`);
      return;
    }

    for await (let doc of this.fetcher.fetch(url, options)) {
      if (this.minimizer) {
        doc = await this.minimizer.min(doc);
      }
      yield Promise.resolve(doc);
    }
  }

  async *run(target, questions, options) {
    this.usage.queries++;
    const seen = {};

    const fetchOptions = options?.fetchOptions || {};
    const docsOptions = { questions, maxPages: options?.maxPages, ...fetchOptions };

    const gen = this.getDocs(target, docsOptions);
    for await (const doc of gen) {
      for await (const r of this._run(doc, questions, options)) {
        const ser = JSON.stringify(r.publicOnly());
        if (seen[ser]) {
          logger.debug(`${this} Dropping duplicate result: ${ser}`);
          continue;
        }
        seen[ser] = true;

        if (doc.htmlUrl) r._htmlUrl = doc.htmlUrl;
        if (doc.screenshotUrl) r._screenshotUrl = doc.screenshotUrl;

        yield Promise.resolve(r);
      }
    }
  }

  isMissing(data, question) {
    return !data[question] || data[question] == '(not found)';
  }

  countMissing(data, questions) {
    let c = 0;
    for (const q of questions) {
      if (this.isMissing(data, q)) {
        c++
      }
    }
    return c;
  }

  async all(target, questions, options) {
    options = {...options, stream: false };
    let result = [];
    try {
      for await (const r of this.run(target, questions, options)) {
        result.push(r);
      }
      return result;
    } catch(e) {
      logger.error(`${this} Got error: ${e}`);
      throw e;
    }
  }

  async one(target, questions, options) {
    options = {...options, stream: false };
    const all = await this.all(target, questions, options);
    return all?.length ? all[0] : null;
  }

  async *stream(target, questions, options) {
    try {
      options = {...options, stream: true };
      for await (const r of this.run(target, questions, options)) {
        yield Promise.resolve(r);
      }
    } catch(e) {
      logger.error(`${this} Got error: ${e}`);
      throw e;
    }
  }
}
