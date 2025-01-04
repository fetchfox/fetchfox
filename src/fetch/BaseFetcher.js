import ShortUniqueId from 'short-unique-id';
import PQueue from 'p-queue';
import { getAI } from '../ai/index.js';
import { logger } from '../log/logger.js';
import { Timer } from '../log/timer.js';
import { Document } from '../document/Document.js';
import { TagRemovingMinimizer } from '../min/TagRemovingMinimizer.js';
import { createChannel, shortObjHash, abortable } from '../util.js';
import { presignS3 } from './util.js';
import { analyzePagination } from './prompts.js';

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
    const timer = new Timer();

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

            const ctx = { timer };
            await this.start(ctx);

            try {
              for await (const doc of this.paginate(url, ctx, options)) {
                channel.send({ doc });
              }
            } catch (e) {
              logger.error(`${this} Caught error while getting documents: ${e}`);
              bad(e);
            }
            finally {
              channel.end();
              await this.finish(ctx);
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
    const timer = ctx?.timer || new Timer();

    await this.goto(url, ctx);

    const doc = await this.current(ctx);
    if (!doc) {
      logger.warn(`${this} could not get document for ${url}, bailing on pagination`);
      return;
    }

    const iterations = options?.maxPages || 0;

    // Kick off job for pages 2+
    const channel = createChannel();
    (async () => {
      if (!iterations || iterations == 1) {
        logger.info(`${this} Not paginating, return`);
        channel.end();
        return;
      }

      const min = new TagRemovingMinimizer(['style', 'script', 'meta', 'link']);
      const minDoc = await min.min(doc, { timer });
      const fns = [];

      const hostname = (new URL(url)).hostname;
      let domainSpecific = {
        'x.com': 'You are on x.com, which paginates by scrolling down exactly one window length. Your pagination should do this.'
      }[hostname] || '';
      if (domainSpecific) {
        domainSpecific = '>>>> Follow this important domain specific guidance:\n\n' + domainSpecific;
        logger.debug(`${this} adding domain specific prompt: ${domainSpecific}`);
      }
      const context = {
        html: minDoc.html,
        domainSpecific,
      };

      let prompts;
      try {
        prompts = await analyzePagination.renderMulti(context, 'html', this.ai);
      } catch (e) {
        logger.error(`${this} Error while rendering prompts: ${e}`);
        return;
      }

      logger.debug(`${this} analyze chunks for pagination (${prompts.length})`);
      for (const prompt of prompts) {
        let answer;
        try {
          answer = await this.ai.ask(prompt, { format: 'json' });
        } catch(e) {
          logger.error(`${this} Got AI error during pagination, ignore: ${e}`);
          continue
        }

        logger.debug(`${this} Got pagination answer: ${JSON.stringify(answer.partial, null, 2)}`);

        if (answer?.partial?.hasPagination &&
          answer?.partial?.paginationJavascript
        ) {
          let fn;
          try {
            fn = new Function(answer.partial.paginationJavascript);
          } catch(e) {
            logger.warn(`${this} Got invalid pagination function ${answer.partial.paginationJavascript}, dropping it: ${e}`);
          }
          if (fn) {
            fns.push(fn);
          }
        }
      }

      if (!fns.length) {
        logger.warn(`${this} Didn't find a way to paginate, bailing`);
        channel.end();
        return;
      }

      let fnIndex = 0;
      for (let i = 1; i < iterations; i++) {
        const fn = fns[fnIndex];
        logger.debug(`${this} Running ${fn} on pagination iteration #${i}`);
        try {
          await this.evaluate(fn, ctx);
          await new Promise(ok => setTimeout(ok, this.paginationWait));

        } catch (e) {
          if (fnIndex >= fns.length) {
            logger.warn(`${this} got pagination error on iteration #${i}, bailing: ${e}`);
            break;
          }

          fnIndex++;
          logger.warn(`${this} got pagination error on iteration #${i} with ${fn}, trying next pagination function: ${e}`);
          continue;
        }

        let doc;
        let aborted;
        try {
          const result = await abortable(this.signal, this.current(ctx));
          aborted = result.aborted;
          doc = result.result;
        } catch (e) {
          logger.error(`${this} Error while getting docs from page: ${e}`);
          throw e;
        }
        if (aborted) {
          logger.warn(`${this} Aborted on _docFromPage during pagination`);
          break;
        }

        logger.info(`${this} got pagination doc ${doc} on iteration ${i}`);
        if (doc) {
          channel.send({ doc });
        }
      }

      channel.end();
    })();

    logger.info(`${this} yielding first page ${doc}`);
    yield Promise.resolve(doc);

    try {
      for await (const val of channel.receive()) {
        if (val.end) {
          break;
        }

        yield Promise.resolve(val.doc);
      }
    } catch (e) {
      logger.error(`${this} Error while reading docs channel in pagination: ${e}`);
      throw e;
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
