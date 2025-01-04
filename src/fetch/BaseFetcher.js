import { getAI } from '../ai/index.js';
import { logger } from '../log/logger.js';
import { Document } from '../document/Document.js';
import { presignS3 } from './util.js';
import { createChannel, shortObjHash } from '../util.js';
import ShortUniqueId from 'short-unique-id';
import PQueue from 'p-queue';

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

  async *fetch(target, options) {
    logger.info(`${this} Fetch ${target} with ${this}`);

    let url;

    if (typeof target == 'string') {
      url = target;
    } else if (typeof target.url == 'string') {
      url = target.url;
    } else if (typeof target._url == 'string') {
      url = target._url;
    }

    // Pull out options that affect caching
    const cacheOptions = {
      css: options?.css,
    };

    let cached;
    try {
      cached = await this.getCache(url, cacheOptions);
    } catch (e) {
      logger.error(`${this} Error getting cache ${target}: ${e}`);
    }

    if (cached) {
      logger.debug(`${this} Returning cached ${cached}`);
      this.usage.cached++;
      for (const doc of cached) {
        yield Promise.resolve(doc);
      }
      return;
    }

    this.usage.requests++;
    const start = (new Date()).getTime();

    const docs = [];

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
      try {
        new URL(url);
      } catch {
        return null;
      }

      const exclude = ['javascript:', 'mailto:'];
      for (const e of exclude) {
        if (url.indexOf(e) == 0) {
          return null;
        }
      }

      const debugStr = () => `(size=${this.q.size}, conc=${this.q.concurrency}, pending=${this.q.pending})`;
      logger.debug(`${this} Adding to fetch queue: ${url} ${debugStr()}`);
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
          return new Promise(async (ok, bad) => {
            logger.debug(`${this} Queue is starting fetch of: ${url} ${debugStr()}`);
            try {
              for await (const doc of this._fetch(url, options)) {
                channel.send({ doc });
              }
            } catch (e) {
              logger.error(`${this} Caught error while getting documents: ${e}`);
              bad(e);
            }
            finally {
              channel.end();
            }
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

          logger.debug(`${this} S3 config: ${JSON.stringify(this.s3)}`);
          if (this.s3) {
            const bucket = this.s3.bucket;
            const region = this.s3.region;
            const keyTemplate = this.s3.key || 'fetchfox-docs/{id}/{url}.html';
            const acl = this.s3.acl || '';
            const id = new ShortUniqueId({
              length: 10,
              dictionary: 'alphanum_lower',
            }).rnd();
            const cleanUrl = url.replace(/[^A-Za-z0-9]+/g, '-');
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

          docs.push(doc);
          yield Promise.resolve(doc);
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
          .then((all) => this.setCache(url, cacheOptions, all))
          .catch((e) => {
            logger.error(`${this} Error while caching docs cache, ignoring: ${e}`);
          });
      }
    }
  }

  async *paginate(url, ctx, options) {
    for await (const doc of this._paginate(url, ctx, options)) {
      yield Promise.resolve(doc);
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
