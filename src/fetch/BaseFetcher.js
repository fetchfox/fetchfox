import PQueue from 'p-queue';
import pTimeout from 'p-timeout';
import { getAI } from '../ai/index.js';
import { logger } from '../log/logger.js';
import { Timer } from '../log/timer.js';
import { Document } from '../document/Document.js';
import { TagRemovingMinimizer } from '../min/TagRemovingMinimizer.js';
import { createChannel, shortObjHash, abortable, srid } from '../util.js';
import { presignS3 } from './util.js';
import { paginationAction } from './prompts.js';
import { FetchInstructions } from './FetchInstructions.js';

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
    this.paginationWait = options?.paginationWait || this.loadWait || 4000;
    this.loadTimeout = options?.loadTimeout || 15 * 1000;
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

      if (target instanceof FetchInstructions) {
        url = options?.url;
      } else {
        let u;
        try {
          u = new URL(url);
        } catch {
          return null;
        }

        if (!['http:', 'https:'].includes(u.protocol)) {
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
          return new Promise(async (ok) => {
            logger.debug(`${this} Queue is starting fetch of: ${url} ${debugStr()}`);

            const ctx = { timer };
            try {
              await this.start(ctx);
            } catch (e) {
              logger.error(`${this} Could not start, skipping ${url}: ${e}`);
              ok();
              return;
            }

            try {
              logger.debug(`${this} Starting at ${url}`);
              
              // Don't break existing pagination behavior for now
              if (target instanceof FetchInstructions) {
                const instructions = [];
                for await (const val of target.fetch()) {
                  instructions.push(val);
                }
                
                for await (const doc of this.execute(instructions, url, ctx, options)) {
                  if (this.signal?.aborted) {
                    break;
                  }
                  
                  channel.send({ doc });
                }
              } else {
                for await (const doc of this.paginate(url, ctx, options)) {
                  if (this.signal?.aborted) {
                    break;
                  }
                  channel.send({ doc });
                }
              }
            } catch (e) {
              logger.error(`${this} Caught error while getting documents, ignoring: ${e}`);
            }

            logger.debug(`${this} Closing docs channel`);
            channel.end();
            this.finish(ctx)
              .catch((e) => {
                logger.error(`${this} Error while finishing, ignoring: ${e}`);
              });
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
            const id = srid(10);
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

    if (this.signal?.aborted) {
      return;
    }

    const gotoCtx = await this.goto(url, ctx, options);
    const myCtx = { ...ctx, url, ...gotoCtx };

    let doc;
    try {
      doc = await pTimeout(this.current(myCtx), { milliseconds: this.loadTimeout });
    } catch (e) {
      logger.error(`${this} Error while getting current: ${e}`);
      throw e;
    }

    if (!doc) {
      // TODO: `finishGoto()` call is duplicated with the one at the
      // end of this function. Refactor remove this duplication.
      await this.finishGoto(myCtx);
      logger.warn(`${this} Could not get document for ${url}, bailing on pagination`);
      return;
    }

    const maxPages = options?.maxPages || 0;

    // Kick off job for pages 2+
    const channel = createChannel();
    (async () => {
      if (!maxPages || maxPages == 1) {
        logger.info(`${this} Not paginating, return`);
        channel.end();
        return;
      }

      const min = new TagRemovingMinimizer(['style', 'script', 'meta', 'link']);
      const minDoc = await min.min(doc, { timer });

      const targetUrl = new URL(url).href;

      let domainSpecific = [
        {
          prefix: /^https:\/\/([a-zA-Z0-9-]+\.)?x\.com/, instruction: 'You are on x.com, which paginates by scrolling down exactly one window length. Your pagination should do this.'
        },
        {
          prefix: /^https:\/\/([a-zA-Z0-9-]+\.)?producthunt\.com/, instruction: `You are on ProductHunt, which paginates using a button with the text "See all of today's products" in it`
        },
        {
          prefix: /^https:\/\/([a-zA-Z0-9-]+\.)?google\.com\/maps/, instruction: 'You are on Google Maps, which paginates by bringing the results list into focus by clicking on it and then scrolling down one window length.'
        },
      ]

      const match = domainSpecific.find(({ prefix }) => prefix.test(targetUrl));

      if (match) {
        domainSpecific = '>>>> Follow this important domain specific guidance:\n\n' + match.instruction;
        logger.debug(`${this} adding domain specific prompt: ${domainSpecific}`);
      } else {
        domainSpecific = '';
      }

      const context = {
        html: minDoc.html,
        domainSpecific,
      };

      let prompts;
      try {
        prompts = await paginationAction.renderMulti(context, 'html', this.ai);
      } catch (e) {
        logger.error(`${this} Error while rendering prompts: ${e}`);
        return;
      }

      const commands = [];

      logger.debug(`${this} analyze chunks for pagination (${prompts.length})`);
      for (const prompt of prompts) {
        let answer;
        try {
          answer = await this.ai.ask(prompt, { format: 'json' });
        } catch(e) {
          logger.error(`${this} Got AI error during pagination, ignore: ${e}`);
          continue
        }

        logger.debug(`${this} Got pagination answer: ${JSON.stringify(answer.partial)}`);

        if (answer.partial?.paginationCommand && answer.partial?.paginationArgument) {
          commands.push({
            command: answer.partial.paginationCommand,
            arg: answer.partial.paginationArgument,
          });
        }
      }

      let index = 0;
      let iteration = 1;  // Already got the first page
      let { result: before } = await abortable(this.signal, this.current(myCtx));
      while (index < commands.length && iteration < maxPages) {
        const { command, arg } = commands[index];
        logger.info(`${this} Paginate with action: ${command} ${arg}, index=${index}, iteration=${iteration}`);
        try {
          switch (command) {
            case 'click':
              await this.click(arg, myCtx);
              break;
            case 'scroll':
              await this.scroll(arg, myCtx);
              break;
            case 'click-scroll':
              await this.click(arg[0], myCtx);
              await this.scroll(arg[1], myCtx);
              break;
            default:
              logger.error(`${this} Unhandled command: ${command} ${arg}`);
              break;
          }
        } catch (e) {
          logger.error(`${this} Error while executing pagination action ${command} ${arg}, ignoring: ${e}`);
        }
        await new Promise(ok => setTimeout(ok, this.paginationWait));
        const { result: after } = await abortable(this.signal, this.current(myCtx));

        const didPaginate = await this.didPaginate(before, after);
        if (didPaginate) {
          logger.debug(`${this} Pagination success`);
          channel.send({ doc: after });
          before = after;
          iteration++;
        } else {
          logger.debug(`${this} Pagination did NOT work`);
          index++;
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
    } finally {
      await this.finishGoto(myCtx);
    }
  }

  // async act(action, ctx) {
  //   console.log('call this._act');
  //   return this._act(action, ctx);
  //   // for await (const doc of this._execute(instructions, url, ctx, options)) {
  //   //   yield doc;
  //   // }
  // }

  async *execute(instructions, url, ctx, options) {
    for await (const doc of this._execute(instructions, url, ctx, options)) {
      yield doc;
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

  async didPaginate(before, after) {
    if (!before?.html || !after?.html) {
      return false;
    }
    return before.html != after.html;
  }

  async setCache(url, options, val) {
    if (!this.cache) return;
    const key = this.cacheKey(url, options);
    logger.debug(`${this} Set fetch cache for ${url} to "${(JSON.stringify(val)).substr(0, 32)}..." key=${key} options=${JSON.stringify(options)}`);
    return this.cache.set(key, val, 'fetch');
  }

}
