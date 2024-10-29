import { logger } from '../log/logger.js';
import { stepDescriptionsMap, nameMap } from './info.js';

export const BaseStep = class {
  constructor(args) {
    this.limit = args?.limit;
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
        await this.finish();
      }
    } finally {
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

  stop() {
    logger.info(`Stop step ${this}`);
    this.stopped = true;
  }

  async run(cursor, steps, index) {
    this.stopped = false;
    try {
      return this._run(cursor, steps, index);
    } catch(e) {
      await cursor.error('' + e, index);
      throw e;
    }
  }
  
  async _run(cursor, steps, index) {
    // TODO: batch process items mode for steps that work better when
    // all items are available. Applies to FilterStep, SchemaStep,
    // and maybe others.

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

    // The following promise resolves on one of three conditions:
    // 1) Hit output limit on the current step
    // 2) Parent is done, and all its outputs are completed
    // 3) There is a next step, and next step is done (regardless 
    await new Promise(async (ok) => {

      const maybeOk = () => {
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

        if (this.stopped) {
          return;
        }

        received++;

        try {
          await this.process(
            { cursor, item, index },
            (output) => {
              if (this.stopped) {
                console.log('got result after stopped');
              }

              const hitLimit = this.limit && this.results.length >= this.limit;
              let done = hitLimit || this.stopped;

              if (!this.stopped) {
                cursor.publish(output, index, done);
                this.results.push(output);
                this.trigger('item', output);
              }

              if (done) {
                ok();
              } else {
                done = maybeOk();
              }

              return done;
            });
        } catch(e) {
          await cursor.error(e, index);
          throw e;
        }

        completed++;

        if (completed >= this.limit) {
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

    this.trigger('done');

    return this.results;
  }
}
