import { logger } from '../log/logger.js';
import { stepDescriptionsMap, nameMap } from './info.js';
import PQueue from 'p-queue';

// Some steps will need a larger batch size, but otherwise keep
// step batches to size of 1 so that items are passed to next
// step immediately
const defaultBatchSize = 1;

export const BaseStep = class {

  constructor(args) {
    this.batchSize = args?.batchSize || defaultBatchSize;
    this.limit = args?.limit;
    // TODO: pull defaults from info
    this.maxPages = args?.maxPages || 1;

    this.callbacks = {};

    this.q = new PQueue({
      concurrency: args?.concurrency || Math.min(100, this.limit || 100),
      intervalCap: args?.intervalCap || 100,
      interval: args?.interval || 1,
      timeout: args?.timeout || 5 * 60 * 1000,
      throwOnTimeout: true,
    });
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  name() {
    return nameMap[this.constructor.name];
  }

  args(a) {
    const info = stepDescriptionsMap[this.name()];
    const args = {};
    for (const key of Object.keys(info.args)) {
      args[key] = this[key];
    }
    return args;
  }

  dump() {
    return {
      name: this.name(),
      args: this.args(),
    };
  }

  async _before(cursor, index) {
    cursor.didStart(index);
    this.results = [];
    if (this.before) {
      return this.before(cursor);
    }
  }

  async _finish(cursor, index) {
    try {
      if (this.finish) {
        await this.finish(cursor, index);
      }
    } finally {
      if (this.start) {
        const took = (new Date()).getTime() - this.start.getTime();
        logger.debug(`${this} took total of ${(took / 1000).toFixed(2)} sec`);
      }
      cursor.finish(index);
    }
  }

  _checkEvent(event) {
    if (!['item', 'done'].includes(event)) {
      throw new Error(`Unhandled event ${event}`);
    }
  }

  on(event, cb) {
    this._checkEvent(event);

    this.callbacks[event] ||= [];
    this.callbacks[event].push(cb);

    return cb;
  }

  trigger(event, item) {
    this._checkEvent(event);

    const cbs = this.callbacks[event] || [];
    cbs.map(cb => cb(item));
  }

  remove(rm) {
    for (const key of Object.keys(this.callbacks)) {
      this.callbacks[key] = this.callbacks[key].filter(cb => cb != rm);
    }
  }

  async run(cursor, steps, index) {
    try {
      return this._run(cursor, steps, index);
    } catch(e) {
      await cursor.error('' + e, index);
      this.trigger('done');
      this._finish(cursor, index)
      throw e;
    }
  }

  async _run(cursor, steps, index) {
    logger.info(`Run ${this}`);

    this.start = new Date();

    await this._before(cursor, index);

    const parent = steps[index - 1];

    const next = index + 1 >= steps.length ? null : steps[index + 1];

    let onNextDone;
    let onParentDone;
    let onParentItem;

    let nextDone = false;
    let parentDone = false;
    let received = 0;
    let completed = 0;

    let done = false;

    // The following promise resolves on one of three conditions:
    // 1) Hit output limit on the current step
    // 2) Parent is done, and all its outputs are completed
    // 3) There is a next step, and next step is done (regardless 
    const processPromise = new Promise(async (ok) => {
      let batch = [];
      const batchSize = this.batchSize;

      const processBatch = async () => {
        const b = [...batch];
        batch = [];
        received += b.length;

        const all = [];

        for (const item of b) {
          const meta = { status: 'loading', sourceUrl: item._url };

          // Create placeholder item for the *first* output
          let firstId = cursor.publish(
            null,
            { _meta: meta },
            index,
            done);

          const p = await this.q.add(
            () => {
              if (cursor.ctx.signal?.aborted) {
                return;
              }

              const itemPromise = this.process(
                { cursor, item, index, batch: b },
                (output) => {
                  this.results.push(output);
                  const hitLimit = this.limit && this.results.length >= this.limit;

                  if (hitLimit) {
                    logger.info(`${this} Hit limit with ${this.results.length} results`);
                  }

                  meta.status = 'done';
                  if (!done) {
                    cursor.publish(
                      firstId,
                      { ...output, _meta: meta },
                      index,
                      done);

                    // Only the *first* output should be an update, so set
                    // use a null ID for the remainder
                    firstId = null;

                    this.trigger('item', output);
                  }

                  done ||= hitLimit;

                  if (done) {
                    logger.debug(`${this} Received done signal inside callback`);
                    ok();
                  } else {
                    done = maybeOk();
                  }

                  return done;
                }
              );

              itemPromise.catch((e) => {
                logger.error(`${this} Got error while processing: ${e}`);

                meta.status = 'error';
                meta.error = `Error in ${this} for url=${item._url}, json=${JSON.stringify(item)}`;
                cursor.publish(
                  firstId,
                  { _meta: meta },
                  index,
                  done);

                if (process.env.STRICT_ERRORS) {
                  throw e;
                } else {
                  logger.warn(`${this} Strict mode not enabled, swallowing error: ${e.stack}`);
                }
              });

              return itemPromise;
            },
            {
              signal: cursor.ctx.signal,
            }
          ); // q.add

          p.catch((e) => {
            logger.error(`{this} Promise queue gave an error: ${e}`);
          });

          all.push(p);
        }

        await Promise.all(all).catch((e) => {
          logger.error(`${this} Got error while waiting for all: ${e}`);
        });

        completed += b.length;

        if (done) {
          ok();
        } else {
          done ||= maybeOk();
        }
      }; // end processBatch

      const maybeOk = () => {
        logger.debug(`Check maybe ok ${this}: parentDone=${parentDone}, nextDone=${nextDone} received=${received}, completed=${completed}`);
        const isOk = (
          (parentDone && received == completed) ||
          nextDone);

        if (isOk) {
          ok();
        }

        return isOk;
      }

      onNextDone = next && next.on(
        'done',
        () => {
          nextDone = true;
          maybeOk();
        });

      onParentDone = parent.on(
        'done',
        () => {
          parentDone = true;
          processBatch();
          maybeOk();
        });

      onParentItem = parent.on('item', async (item) => {
        if (cursor.ctx.signal?.aborted) {
          return;
        }

        logger.debug(`${this} Pushing onto batch, current=${batch.length}, batch size=${batchSize}`);
        batch.push(item);

        if (batch.length >= batchSize) {
          logger.debug(`${this} Process batch`);
          processBatch();
        }
      });

      if (parent) {
        parent.run(cursor, steps, index - 1);
      } else {
        await this.process(cursor, [], (output) => cursor.publish(output, index));
        ok();
      }
    }); // end processPromise

    const abortListener = () => {
      this.q.clear();
      done = true;
    };
    if (cursor.ctx.signal){
      cursor.ctx.signal.addEventListener('abort', abortListener);
    }
    const removeAbortListener = () => {
      if (cursor.ctx.signal) {
        cursor.ctx.signal.removeEventListener('abort', abortListener);
      }
    }
    processPromise.catch((e) => {
      logger.error(`${this} Caught exception while processing: ${e}`);
      removeAbortListener();
      throw e;
    });
    await processPromise;

    const finishPromise = this._finish(cursor, index);
    finishPromise.catch((e) => {
      logger.error(`${this} Caught exception while finishing: ${e}`);
      removeAbortListener();
      throw e;
    });
    await finishPromise;

    onNextDone && next.remove(onNextDone);
    parent.remove(onParentItem);
    parent.remove(onParentDone);

    this.trigger('done');

    return this.results;
g  }
}
