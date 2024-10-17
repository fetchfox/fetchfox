import { logger } from '../log/logger.js';

export const BaseStep = class {
  static combineInfo = (info) => {
    const combined = {...info};
    combined.args.limit = {
      description: 'Limit the number of results in this step.',
      format: 'number',
      example: 5,
      required: false,
    };
    return combined;
  };

  constructor(args) {
    this.limit = args?.limit;
    this.callbacks = {};
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  args(a) {
    const info = this.constructor.info;
    const args = {};
    for (const key of Object.keys(info.args)) {
      args[key] = this[key];
    }
    return args;
  }

  dump() {
    return {
      name: this.constructor.info.name,
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
      if (!this.finish) {
        return;
      }

      const out = await this.finish();

      const key = `Step${index + 1}_${this.constructor.name}`;
      for (let i = 0; i < out.length && i < this.results.length; i++) {
        const item = this.results[i];
        item[key] = out[i];
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

  async run(cursor, upstream, index) {
    await this._before(cursor, index);

    const parent = upstream[upstream.length - 1];
    const rest = upstream.slice(0, upstream.length - 1);

    let onParentDone;
    let onParentItem;

    let parentDone = false;
    let received = 0;
    let completed = 0;

    // The following promise resolves on one of two conditions:
    // 1) Hit output limit on the current step
    // 2) Parent is done, and all its outputs are completed
    await new Promise(async (ok) => {

      const maybeOk = () => {
        if (parentDone && received == completed) {
          ok();
        }
      }

      onParentDone = parent.on(
        'done',
        () => {
          parentDone = true;
          maybeOk();
        });

      onParentItem = parent.on('item', async (item) => {
        received++;

        await this.process(
          cursor,
          item,
          (output) => {
            cursor.publish(output, index);
            this.results.push(output);
            this.trigger('item', output);

            const hitLimit = this.limit && this.results.length >= this.limit;
            const done = hitLimit;

            if (done) ok();

            return done;
          });

        completed++;
        maybeOk();
      });

      if (parent) {
        parent.run(cursor, rest, index - 1);
      } else {
        await this.process(cursor, [], (output) => cursor.publish(output, index));
        ok();
      }
    });

    await this._finish(cursor, index);

    parent.remove(onParentItem);
    parent.remove(onParentDone);

    this.trigger('done');

    return this.results;
  }
}
