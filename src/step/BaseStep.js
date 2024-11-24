import PQueue from 'p-queue';
import { logger } from '../log/logger.js';
import { stepDescriptionsMap, nameMap } from './info.js';

export const BaseStep = class {
  constructor(args) {
    this.limit = args?.limit;
    this.callbacks = {};
    this.q = new PQueue({
      concurrency: args?.concurrency === undefined ? 1000 : args?.concurrency,
      intervalCap: args?.intervalCap === undefined ? 1000 : args?.intervalCap,
      interval: args?.interval === undefined ? 1 : args?.interval,
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
    // TODO: batch process items mode for steps that work better when
    // all items are available. Applies to FilterStep, SchemaStep,
    // and maybe others.

    logger.info(`Run ${this}`);

    await this._before(cursor, index);

    const parent = steps[index - 1];
    // const rest = upstream.slice(0, upstream.length - 1);
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
    await new Promise(async (ok) => {

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
          maybeOk();
        });

      onParentItem = parent.on('item', async (item) => {
        if (
          this.limit !== null &&
          this.limit !== undefined &&
          received >= this.limit)
        {
          return;
        }

        received++;

        try {
          const p = this.q.add(() => {
            if (done) return;

            if (!this.start) {
              this.start = new Date();
            }

            return this.process(
              { cursor, item, index },
              (output) => {
                if (!this.firstResult) {
                  this.firstResult = new Date();
                  const took = this.firstResult - this.start;
                  logger.debug(`${this} got first result after ${(took / 1000).toFixed(2)} sec`);
                }

                this.results.push(output);

                const hitLimit = this.limit && this.results.length >= this.limit;

                if (hitLimit) {
                  logger.info(`Hit limit on step ${this} with ${this.results.length} results`);
                }
                done ||= hitLimit;

                cursor.publish(output, index, done);
                this.trigger('item', output);

                if (done) {
                  logger.debug(`Received done signal inside callback for ${this}`);
                  ok();
                } else {
                  done = maybeOk();
                }

                return done;
              })
          });

          logger.debug(`Step ${this} has ${this.q.size} tasks in queue`);
          await p;

        } catch(e) {
          await cursor.error(e, index);
          throw e;
        }

        completed++;

        if (this.limit && completed >= this.limit) {
          logger.debug(`Number completed in ${this} exceeds limit ${this.limit}, done`);
          ok();
        }

        maybeOk();
      });

      if (parent) {
        parent.run(cursor, steps, index - 1);
      } else {
        await this.process(cursor, [], (output) => cursor.publish(output, index));
        ok();
      }
    });

    await this._finish(cursor, index);

    onNextDone && next.remove(onNextDone);
    parent.remove(onParentItem);
    parent.remove(onParentDone);

    logger.info(`Done with ${this}, clearing queue with ${this.q.size} tasks left`);
    this.q.clear();

    this.trigger('done');

    return this.results;
  }
}
