import { logger } from '../log/logger.js';
import { getAI } from '../ai/index.js';
import { getKV } from '../kv/index.js';
import { DefaultFetcher } from '../fetch/index.js';
import { Document } from '../document/Document.js';

export const BaseExtractor = class {
  constructor(options) {
    const { ai, kv, fetcher, cache, hardCapTokens } = options || {};
    this.ai = getAI(ai, { cache });
    this.kv = getKV(kv);
    this.fetcher = fetcher || new DefaultFetcher({ cache });
    this.hardCapTokens = hardCapTokens || 1e6;
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
    }

    if (!url && typeof target?.source == 'function' && target.source() instanceof Document) {
      yield Promise.resolve(target.source());
      return;
    }

    try {
      new URL(url);
    } catch(e) {
      logger.warn(`Extractor dropping invalid url ${url}: ${e}`);
      url = null;
    }

    if (!url) {
      logger.warn(`Could not find extraction target in ${target}`);
      return;
    }

    for await (const doc of this.fetcher.fetch(url, options)) {
      yield Promise.resolve(doc);
    }
  }

  chunks(doc, maxTokens) {
    if (maxTokens) {
      maxTokens = Math.min(maxTokens, this.hardCapTokens, this.ai.maxTokens);
    } else {
      maxTokens = Math.min(this.hardCapTokens, this.ai.maxTokens);
    }

    // Include only HTML. Make a rough guess as to how many bytes we can include.
    let textChunkSize = 0;
    let htmlChunkSize = maxTokens * 2.5 * 0.6;

    const text = doc?.text || '';
    const html = doc?.html || '';

    if (html.length <= 100) {
      textChunkSize += htmlChunkSize;
      htmlChunkSize = 0;
    }

    const result = [];

    for (let i = 0; ; i++) {
      const textPart = text.slice(
        i * textChunkSize,
        (i + 1) * textChunkSize);

      const htmlPart = html.slice(
        i * htmlChunkSize,
        (i + 1) * htmlChunkSize);

      if (!textPart && !htmlPart) break;

      result.push({
        offset: i,
        text: textPart,
        html: htmlPart,
      });
    }

    for (let i = 0; i < result.length; i++) {
      result[i].more = i + 1 < result.length;
    }

    return result;
  }

  async *run(target, questions, options) {
    this.usage.queries++;
    const start = (new Date()).getTime();

    try {
      const map = {};

      const docs = [];
      // TODO: process multiple docs concurrently
      for await (const doc of this.getDocs(target, { questions, maxPages: options?.maxPages })) {
        for await (const r of this._run(doc, questions, options)) {
          for (const key of Object.keys(r)) {
            const remap = map[key];
            if (remap) {
              const val = r[key];
              delete r[key];
              r[remap] = val;
            }
          }

          if (doc.htmlUrl) r._htmlUrl = doc.htmlUrl;
          if (doc.screenshotUrl) r._screenshotUrl = doc.screenshotUrl;

          yield Promise.resolve(r);
        }
      }
    } finally {
      const took = (new Date()).getTime() - start;
      this.usage.runtime += took;
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
    for await (const r of this.run(target, questions, options)) {
      result.push(r);
    }
    return result;
  }

  async one(target, questions, options) {
    options = {...options, stream: false };
    const all = await this.all(target, questions, options);
    return all?.length ? all[0] : null;
  }

  async *stream(target, questions, options) {
    options = {...options, stream: true };
    for await (const r of this.run(target, questions, options)) {
      yield Promise.resolve(r);
    }
  }
}
