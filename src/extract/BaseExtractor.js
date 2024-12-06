import { logger } from '../log/logger.js';
import { getKV } from '../kv/index.js';
import { getAI } from '../ai/index.js';
import { getFetcher } from '../fetch/index.js';
import { getMinimizer } from '../min/index.js';
import { DefaultFetcher } from '../fetch/index.js';
import { Document } from '../document/Document.js';
import { AIError } from '../ai/AIError.js';
import { createChannel } from '../util.js';

export const BaseExtractor = class {
  constructor(options) {
    const { kv, ai, fetcher, minimizer, cache, hardCapTokens } = options || {};
    this.kv = getKV(kv);
    this.ai = getAI(ai, { cache });
    this.fetcher = getFetcher(fetcher, { cache });
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
    }

    if (!url && typeof target?.source == 'function' && target.source() instanceof Document) {
      yield Promise.resolve(target.source());
      return;
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

  async chunks(doc, maxTokens) {
    if (maxTokens) {
      maxTokens = Math.min(maxTokens, this.hardCapTokens, this.ai.maxTokens);
    } else {
      maxTokens = Math.min(this.hardCapTokens, this.ai.maxTokens);
    }
    return doc.htmlChunks((str) => this.ai.countTokens(str), this.ai.maxTokens - 20000);
  }

  async *run(target, questions, options) {
    this.usage.queries++;
    const start = (new Date()).getTime();

    const seen = {};

    let done = false;

    try {
      const map = {};
      const docs = [];
      const docsOptions = { questions, maxPages: options?.maxPages };

      const docsChannel = createChannel();
      const resultsChannel = createChannel();

      // Start documents worker
      (async (ok) => {
        logger.info(`${this} started pagination docs worker`);
        const gen = this.getDocs(target, docsOptions);

        for await (const doc of gen) {
          if (done) break;

          logger.debug(`${this} sending doc ${doc} onto channel`);
          docsChannel.send({ doc });
        }
        docsChannel.send({ end: true });
      })();

      let count = 0;

      // Get documents, and start extraction worker for each
      (async () => {
        for await (const val of docsChannel.receive()) {
          if (val.end) break;

          const doc = val.doc;
          logger.info(`${this} starting new worker on ${doc} (${++count})`);

          // Start an extraction worker
          (async () => {
            for await (const r of this._run(doc, questions, options)) {
              if (done) break;

              const ser = JSON.stringify(r.publicOnly());
              if (seen[ser]) {
                logger.debug(`${this} dropping duplicate result: ${ser}`);
                continue;
              }
              seen[ser] = true;

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

              logger.debug(`${this} sending result ${r} onto channel`);
              resultsChannel.send({ result: r });
            }

            resultsChannel.send({ end: true });
          })();
        }
      })();

      for await (const val of resultsChannel.receive()) {
        if (done) break;

        if (val.end) break;
        yield Promise.resolve(val.result);
      }

    } catch (e) {
      if (e instanceof AIError) {
        logger.error(`${this} Got AI error, bailing: ${e}`);
        return;
      }

    } finally {
      done = true;

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
