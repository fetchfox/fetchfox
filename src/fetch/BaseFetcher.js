import PQueue from 'p-queue';
import { getAI } from '../ai/index.js';
import { logger } from '../log/logger.js';
import { Document } from '../document/Document.js';
import { createChannel, shortObjHash, srid } from '../util.js';
import { presignS3 } from './util.js';
import { Instructions } from './Instructions.js';

export const BaseFetcher = class {
  constructor(options) {
    this.cache = options?.cache;
    this.ai = options?.ai || getAI();
    this.queue = [];
    this.usage = {
      requests: 0,
      completed: 0,
      cached: 0,
      runtime: 0,
    };

    this.q = new PQueue({
      concurrency: options?.concurrency || 4,
      intervalCap: options?.intervalCap || 1,
      interval: options?.interval || 1000,
    });

    this.s3 = options?.s3;
    this.css = options?.css;
    this.signal = options?.signal;

    this.loadWait = options?.loadWait || 4000;
    this.loadTimeout = options?.loadTimeout || 60000;
    this.actionWait = options?.actionWait || 2000;
    this.locatorTimeout = options?.locatorTimeout || 1000;
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  async first(target, options) {
    try {
      for await (const doc of this.fetch(target, options)) {
        return doc;
      }
    } catch (e) {
      logger.error(`${this} Error getting cache ${target}: ${e}`);
    }
  }

  async clear() {
    logger.info(`${this} clear fetch queue`);
    this.q.clear();
  }

  async start() {
  }

  async finish() {
  }

  async *fetch(target, options) {
    logger.info(`${this} Fetch ${target} with ${this}`);

    const toInstructions = (target) => {
      let instr;
      if (target instanceof Instructions) {
        instr = target;
      } else {
        let url;
        if (typeof target == 'string') {
          url = target;
        } else if (typeof target.url == 'string') {
          url = target.url;
        } else if (typeof target._url == 'string') {
          url = target._url;
        }

        instr = new Instructions(
          url,
          [],
          {
            ai: this.ai,
            cache: this.cache,
            loadTimeout: this.loadTimeout,
          });
      }

      const maxPages = options?.maxPages || 0;
      if (maxPages > 1) {
        instr.unshiftCommand({
          prompt: '{{nextPage}}',
          limit: maxPages,
        });
      }

      return instr;
    }

    const instr = toInstructions(target);
    try {
      const url = new URL(instr.url);
      if (!['http:', 'https:'].includes(url.protocol)) {
        logger.debug(`${this} Skipping because of protocol: ${url}`);
        return null;
      }
    } catch {
      return null;
    }

    // Pull out options that affect caching
    const cacheOptions = {
      css: options?.css,
    };

    let cached;
    try {
      cached = await this.getCache(instr.serialize(), cacheOptions);
    } catch (e) {
      logger.error(`${this} Error getting cache ${target}: ${e}`);
    }

    if (cached) {
      logger.debug(`${this} Returning cached ${cached}`);
      this.usage.cached++;
      for (const doc of cached) {
        logger.info(`${this} Yielding cached document: ${doc}`);
        yield Promise.resolve(doc);
      }
      return;
    }

    this.usage.requests++;
    const start = (new Date()).getTime();

    const docs = [];
    const pushAndReturn = (doc) => {
      docs.push(doc);
      return doc;
    }

    const abortListener = () => {
      this.q.clear();
    }

    if (this.signal) {
      if (this.signal.aborted) {
        abortListener();
        return;
      }

      this.signal.addEventListener('abort', abortListener);
    }

    try {
      if (await isPdf(instr.url)) {
        const host = process.env.API_HOST || 'https://fetchfox.ai';
        const apiUrl = `${host}/api/v2/pdf?url=${encodeURIComponent(instr.url)}`;

        logger.debug(`${this} Decoding PDF via ${apiUrl}`);
        instr.url = apiUrl;
      }


      const debugStr = () => `(size=${this.q.size}, conc=${this.q.concurrency}, pending=${this.q.pending})`;
      logger.debug(`${this} Adding to fetch queue: ${instr} ${debugStr()}`);
      const priority = options?.priority || 1;

      // Use channel + promise wrapper to convert async generator into a
      // promise that p-queue can throttle.
      const channel = createChannel();
      const p = this.q.add(
        () => {
          // We should replace `createChannel` with another library. Until then,
          // allow async Promise executor here to support an async generator
          // feeding into a channel.
          // See https://github.com/fetchfox/fetchfox/issues/42
          /* eslint-disable no-async-promise-executor */
          return new Promise(async (ok) => {
            logger.debug(`${this} Queue is starting fetch of: ${instr} ${debugStr()}`);

            try {
              logger.debug(`${this} Starting at ${instr.url}`);

              let skipOne = false;
              for await (const r of instr.learn(this)) {
                const doc = r?.doc;
                if (this.signal?.aborted) {
                  break;
                }
                if (doc) {
                  channel.send({ doc });
                  skipOne = true;
                }
              }

              const gen = await instr.execute(this);

              for await (const r of gen) {
                const doc = r?.doc;
                if (this.signal?.aborted) {
                  break;
                }
                if (skipOne) {
                  skipOne = false;
                  continue;
                }
                if (doc) {
                  channel.send({ doc });
                }
              }

            } catch (e) {
              if (process.env.STRICT_ERRORS) {
                throw e;
              } else {
                logger.error(`${this} Caught error while getting documents, ignoring: ${e}`);
              }
            }

            logger.debug(`${this} Closing docs channel`);
            channel.end();

            ok();
          });
          /* eslint-enable no-async-promise-executor */
        },
        { priority });

      p.catch((e) => {
        logger.debug(`${this} Caught error on fetcher queue: ${e}`);
        throw e;
      });

      logger.debug(`${this} Fetch queue has ${this.q.size} requests ${debugStr()}`);

      this.usage.completed++;

      try {
        for await (const val of channel.receive()) {
          if (val.end) {
            break;
          }

          const doc = val.doc;

          logger.debug(`${this} Should we filter for CSS? ${options?.css}`);
          if (options?.css) {
            doc.parseHtml(options.css);
          }

          await this.putS3(doc);

          logger.info(`${this} Yielding document: ${doc}`);
          yield Promise.resolve(pushAndReturn(doc));
        }
      } catch (e) {
        logger.error(`${this} Error while reading from documents channel: ${e}`);
        throw e;
      }

    } finally {
      if (this.signal) {
        this.signal.removeEventListener('abort', abortListener);
      }
      const took = (new Date()).getTime() - start;
      this.usage.runtime += took;

      if (docs.length) {
        Promise
          .all(docs.map(doc => doc.dump()))
          .then((all) => this.setCache(instr.serialize(), cacheOptions, all))
          .catch((e) => {
            logger.error(`${this} Error while caching docs cache, ignoring: ${e}`);
          });
      }
    }
  }

  async putS3(doc) {
    logger.debug(`${this} S3 config: ${JSON.stringify(this.s3)}`);
    if (!this.s3) {
      return;
    }

    const bucket = this.s3.bucket;
    const region = this.s3.region;
    const keyTemplate = this.s3.key || 'fetchfox-docs/{id}/{url}.html';
    const acl = this.s3.acl || '';
    const id = srid(10);
    const cleanUrl = doc.url.replace(/[^A-Za-z0-9]+/g, '-');
    const key = keyTemplate
      .replaceAll('{id}', id)
      .replaceAll('{url}', cleanUrl);

    try {
      const presignedUrl = await presignS3({
        bucket, key, contentType: 'text/html', acl, region });
      await doc.uploadHtml(presignedUrl);
    } catch (e) {
      logger.error(`${this} Failed to upload ${key}: ${e}`);
    }
  }

  cacheOptions() {
    return {};
  }

  cacheKey(url, options) {
    const hash = shortObjHash({ url, options, ...this.cacheOptions() })
      return `fetch-${this.constructor.name}-${url.replaceAll(/[^A-Za-z0-9]+/g, '-').substr(0, 120)}-${hash}`;
  }

  async getCache(url, options) {
    if (!this.cache) return;

    const key = this.cacheKey(url, options);
    let result
    try {
      result = await this.cache.get(key);
    } catch (e) {
      logger.error(`${this} Error getting cache ${key}: ${e}`);
      return;
    }
    const hit = Array.isArray(result) && result.length > 0;
    const outcome = hit ? '(hit)' : '(miss)';
    logger.debug(`${this} Fetch cache ${outcome} for ${url} ${result} key=${key} options=${JSON.stringify(options)}`);

    if (hit) {
      const docs = [];
      for (const data of result) {
        const doc = new Document();
        try {
          await doc.loadData(data);
        } catch (e) {
          logger.error(`${this} Error loading data ${doc}: ${e}`);
          return;
        }
        docs.push(doc);
      }
      logger.debug(`${this} Fetch cache loaded ${docs.map(d => ''+d).join(', ')}`);
      return docs;
    } else {
      return null;
    }
  }

  async setCache(url, options, val) {
    if (!this.cache) return;
    const key = this.cacheKey(url, options);
    logger.debug(`${this} Set fetch cache for ${url} to "${(JSON.stringify(val)).substr(0, 32)}..." key=${key} options=${JSON.stringify(options)}`);
    return this.cache.set(key, val, 'fetch');
  }
}

const isPdf = async (url) => {
  try {
    const resp = await fetch(url, { method: 'HEAD' });
    const contentType = resp.headers.get('Content-Type');

    return contentType && contentType.startsWith('application/pdf');
  } catch (e) {
    logger.error(`Error while fetching content type for ${url}: ${e.stack}`);
    return false;
  }
}
