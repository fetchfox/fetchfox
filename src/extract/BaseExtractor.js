import chalk from 'chalk';
import { logger as defaultLogger } from '../log/logger.js';
import { getAI } from '../ai/index.js';
import { getFetcher } from '../fetch/index.js';
import { Document } from '../document/Document.js';
import { createChannel } from '../util.js';

export const BaseExtractor = class {
  constructor(options) {
    const { ai, fetcher, signal, cache, logger, hardCapTokens, hint } = options || {};
    this.signal = signal;
    this.cache = cache;
    this.logger = logger || defaultLogger;
    this.ai = getAI(ai, { cache, signal, logger });
    this.fetcher = getFetcher(fetcher, { cache, signal, logger });
    this.hardCapTokens = hardCapTokens || 1e7;
    this.hint = hint;
    this.timeout = options?.timeout || this.fetcher.timeout || 60 * 1000;
    this.usage = {
      requests: 0,
      runtime: 0,
    };
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
      this.logger.warn(`${this} Could not find extraction target in ${target}`);
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

    try {
      const fetchOptions = options?.fetchOptions || {};
      const docsOptions = { questions, maxPages: options?.maxPages, ...fetchOptions };

      const docsChannel = createChannel();
      const resultsChannel = createChannel();

      // Start documents worker

      // See https://github.com/fetchfox/fetchfox/issues/42
      /* eslint-disable no-async-promise-executor */
      const docsPromise = new Promise(async (ok, bad) => {
        this.logger.info(`${this} Started pagination docs worker`);
        const gen = this.getDocs(target, docsOptions);

        try {
          for await (const doc of gen) {
            if (done) break;
            this.logger.debug(`${this} Sending doc ${doc} onto channel done=${done}`);
            docsChannel.send({ doc });
          }
          ok();
        } catch(e) {
          this.logger.error(`${this} Error in documents worker: ${e}`);
          bad(e);

        } finally {
          this.logger.debug(`${this} Done with docs worker`);
          docsChannel.end();
        }
      }); // end docsPromise
      /* eslint-enable no-async-promise-executor */

      // Get documents, and start extraction worker for each

      // See https://github.com/fetchfox/fetchfox/issues/42
      /* eslint-disable no-async-promise-executor */
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
            this.logger.info(`${this} Starting new worker on ${doc} (${myIndex}) done=${done}`);

            // Start an extraction worker
            workerPromises.push(
              new Promise(async (ok, bad) => {
                try {
                  for await (const r of this._run(doc, questions, options)) {
                    if (this.signal?.aborted) {
                      break;
                    }
                    if (done) {
                      break;
                    }

                    const ser = JSON.stringify(r.publicOnly());

                    let onlyNotFound = true;
                    for (const val of Object.values(r.publicOnly())) {
                      onlyNotFound = onlyNotFound && val == '(not found)';
                    }
                    if (onlyNotFound) {
                      this.logger.debug(`${this} Dropping empty result: ${ser}`);
                      continue;
                    }

                    if (seen[ser]) {
                      this.logger.debug(`${this} Dropping duplicate result: ${ser}`);
                      continue;
                    }
                    seen[ser] = true;

                    if (doc.htmlUrl) r._htmlUrl = doc.htmlUrl;
                    if (doc.screenshotUrl) r._screenshotUrl = doc.screenshotUrl;

                    this.logger.debug(`${this} Sending result ${r} onto channel`);
                    resultsChannel.send({ result: r });
                  }

                  this.logger.debug(`${this} Extraction worker done ${myIndex} (${workerPromises.length})`);
                  ok();

                } catch(e) {
                  this.logger.error(`${this} Error in extraction promise: ${e} ${e.stack}`);
                  bad(e);
                }
              }));
          }

          // Got all documents, now wait for workers to complete
          this.logger.debug(`${this} Wait for extraction workers`);
          await Promise.all(workerPromises);
          ok();

        } catch (e) {
          this.logger.error(`${this} Error in extraction worker: ${e}`);
          bad(e);

        } finally {
          this.logger.debug(`${this} All extraction workers done ${done}`);
          resultsChannel.end();
        }
      }); // end resultsPromise
      /* eslint-enable no-async-promise-executor */

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
          this.logger.debug(`${this} Found ${++count} items so far`);
          this.logger.info(`${chalk.green('\u{25CF}')} Yielding item ${JSON.stringify(val.result)}`);
          yield Promise.resolve(val.result);
        }
      } catch (e) {
        this.logger.error(`${this} Error while reading form results channel: ${e}`);
        throw e;
      }

      try {
        await docsPromise;
      } catch (e) {
        this.logger.error(`${this} Error while waiting for docs promise: ${e}`);
        throw e;
      }

      try {
        await resultsPromise;
      } catch (e) {
        this.logger.error(`${this} Error while waiting for docs promise: ${e}`);
        throw e;
      }

    } finally {
      this.logger.info(`${this} Done extracting ${JSON.stringify(target).substring(0, 400)}`);

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
      this.logger.error(`${this} Got error: ${e}`);
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
      this.logger.error(`${this} Got error: ${e}`);
      throw e;
    }
  }
}
