import { logger } from '../log/logger.js';
import { getKV } from '../kv/index.js';
import { getAI } from '../ai/index.js';
import { getFetcher } from '../fetch/index.js';
import { getMinimizer } from '../min/index.js';
import { DefaultFetcher } from '../fetch/index.js';
import { Document } from '../document/Document.js';
import { createChannel } from '../util.js';

export const BaseExtractor = class {
  constructor(options) {
    const { kv, ai, fetcher, minimizer, signal, cache, hardCapTokens } = options || {};
    this.signal = signal;
    this.cache = cache;
    this.kv = getKV(kv);
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

  async *run(target, questions, options) {
    this.usage.queries++;
    const start = (new Date()).getTime();

    const seen = {};
    let done = false;
    let error;

    try {
      const docs = [];
      const fetchOptions = options?.fetchOptions || {};
      const docsOptions = { questions, maxPages: options?.maxPages, ...fetchOptions };

      const docsChannel = createChannel();
      const resultsChannel = createChannel();

      // Start documents worker
      const docsPromise = new Promise(async (ok, bad) => {
        logger.info(`${this} Started pagination docs worker`);
        const gen = this.getDocs(target, docsOptions);

        try {
          for await (const doc of gen) {
            if (done) break;
            logger.debug(`${this} Sending doc ${doc} onto channel done=${done}`);
            docsChannel.send({ doc });
          }
          ok();
        } catch(e) {
          logger.error(`${this} Error in documents worker: ${e}`);
          bad(e);

        } finally {
          logger.debug(`${this} Done with docs worker`);
          docsChannel.end();
        }
      }); // end docsPromise

      // Get documents, and start extraction worker for each
      const resultsPromise = new Promise(async (ok, bad) => {
        const workerPromises = [];

        try {
          // Get documents from channel and start worker for each
          for await (const val of docsChannel.receive()) {
            if (val.end) {
              break;
            }
            if (done) {
              break;
            }

            const doc = val.doc;
            const myIndex = workerPromises.length;
            logger.info(`${this} Starting new worker on ${doc} (${myIndex}) done=${done}`);

            // Start an extraction worker
            workerPromises.push(
              new Promise(async (ok, bad) => {
                try {
                  for await (const r of this._run(doc, questions, options)) {
                    if (done) {
                      break;
                    }

                    const ser = JSON.stringify(r.publicOnly());
                    if (seen[ser]) {
                      logger.debug(`${this} Dropping duplicate result: ${ser}`);
                      continue;
                    }
                    seen[ser] = true;

                    if (doc.htmlUrl) r._htmlUrl = doc.htmlUrl;
                    if (doc.screenshotUrl) r._screenshotUrl = doc.screenshotUrl;

                    logger.debug(`${this} Sending result ${r} onto channel`);
                    resultsChannel.send({ result: r });
                  }

                  logger.debug(`${this} Extraction worker done ${myIndex} (${workerPromises.length})`);
                  ok();

                } catch(e) {
                  logger.error(`${this} Error in extraction promise: ${e}`);
                  bad(e);
                }
              }));
          }

          // Got all documents, now wait for workers to complete
          logger.debug(`${this} Wait for extraction workers`);
          await Promise.all(workerPromises);
          ok();

        } catch (e) {
          logger.error(`${this} Error in extraction worker: ${e}`);
          bad(e);

        } finally {
          logger.debug(`${this} All extraction workers done ${done}`);
          resultsChannel.end();
        }
      }); // end resultsPromise

      // Receive and yield results
      let count = 0;
      try {
        for await (const val of resultsChannel.receive()) {
          if (done) {
            break;
          }
          if (val.end) {
            break;
          }
          logger.debug(`${this} Found ${++count} items so far`);
          yield Promise.resolve(val.result);
        }
        await docsPromise;
        await resultsPromise;
      } catch (e) {
        throw e;
      }

    } finally {
      logger.info(`${this} done extracting ${target}`);

      if (error) {
        logger.error(`${this} Throwing caught error ${error}`);
        throw error;
      }

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
