import { logger } from '../log/logger.js';
import { validate } from './util.js';
import { chunkList } from '../util.js';
import { BaseCrawler } from './BaseCrawler.js';
import { gather } from './prompts.js';
import { createChannel } from '../util.js';

export const Crawler = class extends BaseCrawler {
  async *run(url, query, options) {
    this.usage.requests++
    const maxPages = options?.maxPages;
    const fetchOptions = options?.fetchOptions || {};
    const seen = {};

    const start = (new Date()).getTime();

    const docsChannel = createChannel();
    const resultsChannel = createChannel();
    let done = false;

    // Start documents worker

    // See https://github.com/fetchfox/fetchfox/issues/42
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
          docsChannel.send({ doc });
        }
        ok();

      } catch(e) {
        logger.error(`${this} Error in documents worker: ${e}`);
        bad(e);

      } finally {
        logger.debug(`${this} Done with docs worker`);
        gen.return();
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
                for await (const r of this._processDoc(doc, query, seen, options)) {
                  resultsChannel.send({ result: r });
                }

                logger.debug(`${this} Link worker done ${myIndex} (${workerPromises.length})`);
                ok();

              } catch(e) {
                logger.error(`${this} Error in link promise: ${e}`);
                bad(e);
              }
            }));
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
        resultsChannel.end();
      }
    }); // resultsPromise
    /* eslint-enable no-async-promise-executor */

    // Receive and yield results
    let count = 0;
    try {
      for await (const val of resultsChannel.receive()) {
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
      const took = (new Date()).getTime() - start;
      this.usage.runtime += took;
      done = true;
    }
  }

  async *_processDoc(doc, query, seen, options) {
    doc.parseLinks(options?.css);
    const links = doc.links;
    doc.parseLinks();

    const maxBytes = this.ai.maxTokens / 2;
    const slimmer = item => ({
      id: item.id,
      html: item.html.substr(0, 200),
      text: item.text,
      url: item.url,
    });

    const chunked = chunkList(links.map(slimmer), maxBytes);

    for (let i = 0; i < chunked.length; i++) {
      const chunk = chunked[i];
      const prompt = gather.render({
        query,
        links: JSON.stringify(
          chunk.filter(l => validate(l.url)),
          null,
          2),
      });

      const toLink = {};
      for (const link of links) {
        toLink[link.id] = link;
      }

      const stream = this.ai.stream(prompt, { format: 'jsonl' });

      for await (const { delta } of stream) {
        if (!toLink[delta.id]) {
          logger.warn(`${this} Could not find link with id ${delta.id}`);
          continue;
        }

        const link = toLink[delta.id];

        if (seen[link.url]) continue;
        seen[link.url] = true;
        delete link.id;

        logger.info(`Found link ${link.url} in response to "${query}"`);

        this.usage.count++;
        yield Promise.resolve({ _url: link.url });
      }
    }
  }

  async all(url, query, options) {
    options = {...options, stream: false };
    let result = [];
    for await (const r of this.run(url, query, options)) {
      result.push(r);
    }
    return result;
  }

  async one(url, query, options) {
    options = {...options, stream: true };
    for await (const r of this.run(url, query, options)) {
      return r;
    }
  }

  async *stream(url, query, options) {
    options = {...options, stream: true };
    for await (const r of this.run(url, query, options)) {
      yield Promise.resolve(r);
    }
  }
}
