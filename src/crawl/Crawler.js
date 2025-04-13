import chalk from 'chalk';
import { logger } from '../log/logger.js';
import { BaseCrawler } from './BaseCrawler.js';
import { PatternCrawler } from './PatternCrawler.js';
import { gather } from './prompts.js';
import { createChannel } from '../util.js';

export const Crawler = class extends BaseCrawler {
  usePattern(url, query) {
    try {
      if ((new URL(url)).pathname.includes('*')) {
        return true;
      }
    } catch {
      // no-op
    }

    try {
      if ((new URL(query)).pathname.includes('*')) {
        return true;
      }
    } catch {
      // no-op
    }

    return false;
  }

  async *run(url, query, options) {
    if (this.usePattern(url, query)) {
      this.logger.debug(`${this} Using pattern crawler for url=${url} query=${query}`);

      const pc = new PatternCrawler(this);
      const urls = Array.isArray(url) ? url : [url];
      const gen = pc.run(urls, options);
      for await (const r of gen) {
        yield Promise.resolve(r);
      }
      return;
    }

    throw 'STOP!';

    this.usage.requests++;
    const maxPages = options?.maxPages;
    const fetchOptions = options?.fetchOptions || {};

    const start = new Date().getTime();

    const docsChan = createChannel();
    const resultsChan = createChannel();
    let done = false;

    let abortListener;
    if (this.signal) {
      abortListener = () => {
        done = true;
      };
      this.signal.addEventListener('abort', abortListener);
    }

    // Start documents worker

    /* eslint-disable no-async-promise-executor */
    const docsPromise = new Promise(async (ok, bad) => {
      logger.info(`${this} Started pagination docs worker`);
      const gen = this.fetcher.fetch(url, { maxPages, ...fetchOptions });

      try {
        for await (const doc of gen) {
          if (done) {
            break;
          }

          logger.debug(`${this} Sending doc ${doc} onto channel done=${done}`);
          docsChan.send({ doc });
        }
        ok();
      } catch (e) {
        logger.error(`${this} Error in documents worker: ${e}`);
        bad(e);
      } finally {
        if (abortListener) {
          this.signal.removeEventListener('abort', abortListener);
        }

        logger.debug(`${this} Done with docs worker`);
        gen.return();
        docsChan.end();
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
        for await (const val of docsChan.receive()) {
          if (done) {
            break;
          }
          if (val.end) {
            break;
          }

          const doc = val.doc;
          const myIndex = workerPromises.length;
          logger.info(`${this} Starting new link worker on ${doc} (${myIndex}) done=${done}`);

          // Start an extraction worker
          workerPromises.push(
            new Promise(async (ok, bad) => {
              try {
                for await (const r of this._processDoc(doc, query)) {
                  resultsChan.send({ result: r });
                }

                logger.debug(`${this} Link worker done ${myIndex} (${workerPromises.length})`);
                ok();
              } catch (e) {
                logger.error(`${this} Error in link promise: ${e}`);
                bad(e);
              }
            }),
          );
        }

        // Got all documents, now wait for workers to complete
        logger.debug(`${this} Wait for link workers`);
        await Promise.all(workerPromises);
        ok();
      } catch (e) {
        logger.error(`${this} Error in link worker: ${e}`);
        bad(e);
      } finally {
        logger.debug(`${this} All link workers done ${done}`);
        resultsChan.end();
      }
    }); // resultsPromise
    /* eslint-enable no-async-promise-executor */

    // Receive and yield results
    let count = 0;
    try {
      for await (const val of resultsChan.receive()) {
        if (val.end) {
          break;
        }

        logger.debug(`${this} Found ${++count} items so far`);
        yield Promise.resolve(val.result);
      }

      await docsPromise;
      await resultsPromise;
    } catch (e) {
      logger.error(`${this} Crawler caught error: ${e}`);
      throw e;
    } finally {
      const took = new Date().getTime() - start;
      this.usage.runtime += took;
      done = true;
    }
  }

  async *_processDoc(doc, query) {
    // TODO: move this init to a better spot.
    // maybe make getAI() async and put it there.
    await this.ai.init();

    const context = {
      query,
      url: doc.url,
      body: doc.html,
    };
    const prompts = await gather.renderMulti(context, 'body', this.ai);

    for (const prompt of prompts) {
      const stream = this.ai.stream(prompt, { format: 'jsonl' });
      for await (const { delta } of stream) {
        if (this.signal?.aborted) {
          return;
        }
        logger.info(`${chalk.yellow('\u{25CF}')} Found link ${delta.url} in response to "${query}"`);
        yield Promise.resolve({ _url: delta.url });
      }
    }
  }
};
