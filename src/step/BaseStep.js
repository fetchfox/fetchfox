import { logger } from '../log/logger.js';
import { stepDescriptionsMap, nameMap } from './info.js';

export const BaseStep = class {
  static batchSize = 10;

  constructor(args) {
    this.limit = args?.limit;
    // TODO: pull defaults from info
    this.maxPages = args?.maxPages || 5;


    this.callbacks = {};
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

    this.start = new Date();

    await this._before(cursor, index);

    const parent = steps[index - 1];

    console.log('PARENT', parent);

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
      let batch = [];
      const batchSize = BaseStep.batchSize;

      const processBatch = async () => {
        console.log('processBatch:', batch);

        const b = [...batch];
        batch = [];

        received += b.length;

        try {
          const all = [];

          for (const item of b) {
            const p = this.process(
              { cursor, item, index, batch: b },
              (output) => {
                console.log('got output ===>' + this, output);

                this.results.push(output);
                const hitLimit = this.limit && this.results.length >= this.limit;

                console.log('limit? ===>' + this, this.results.length, this.limit);

                if (hitLimit) {
                  console.log('HIT LIMIT');
                  logger.info(`${this} Hit limit with ${this.results.length} results`);
                }

                if (!done) {
                  cursor.publish(output, index, done);
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
            all.push(p);
          }

          await Promise.all(all);

          // const doneOnBatch = await this.processBatch(
          //   { cursor, items: b, index },
          //   maybeOk);
          // done ||= doneOnBatch;
          // console.log('DONE?' + this, done);

        } catch(e) {
          await cursor.error(e, index);
          throw e;
        }

        completed += b.length;

        if (done) {
          ok();
        } else {
          done ||= maybeOk();
        }
      };

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
          console.log('!!! NEXT done' + this);
          nextDone = true;
          maybeOk();
          // throw 'STOP';
        });

      onParentDone = parent.on(
        'done',
        () => {
          console.log('!!! parent done' + this);
          parentDone = true;
          processBatch();
          maybeOk();
          // throw 'xyz';
        });

      onParentItem = parent.on('item', async (item) => {
        console.log('Got parent item'+this, item);
        if (
          this.limit !== null &&
          this.limit !== undefined &&
          received >= this.limit)
        {
          console.log('Ignore parent item due to:' + this, received);
          return;
        }

        logger.debug(`${this} Pushing onto batch, current=${batch.length}, limit=${batchSize}`);
        batch.push(item);

        if (batch.length >= batchSize) {
          logger.debug(`${this} Process batch`);
          processBatch();
        }
      });

      if (parent) {
        console.log('RUN PARENT', parent.name());
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

    console.log('TRIGGER DONE' + this);
    this.trigger('done');
    // throw 'DONE';

    return this.results;
  }
}
