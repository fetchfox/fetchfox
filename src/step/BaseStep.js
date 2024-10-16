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
    if (this.before) {
      return this.before(cursor);
    }
  }

  async _finish(cursor, index, buffer) {
    try {
      if (!buffer || buffer.length == 0) {
        return;
      }

      if (!this.finish) {
        throw new Error('got buffer but no finish stage');
      }

      const out = await this.finish();
      if (!out) {
        return buffer;
      }

      const key = `Step${index + 1}_${this.constructor.name}`;
      for (let i = 0; i < out.length && i < buffer.length; i++) {
        const item = buffer[i];
        item[key] = out[i];
      }

      return buffer;

    } finally {
      cursor.finish(index);
    }
  }

  async *pipe(cursor, inputs, index) {
    try {
      for await (const r of this._pipe(cursor, inputs, index)) {
        yield Promise.resolve(r);
      }
    } catch(e) {
      cursor.error(e.toString(), index);
    }
  }

  async *_pipe(cursor, inputs, index) {
    let buffer;
    if (this.finish) {
      buffer = [];
    }

    const complete = (item) => {
      cursor.publish(item, index);
      return Promise.resolve(item);
    }

    try {
      await this._before(cursor, index);

      for await (const item of inputs) {
        cursor.didStart(index);

        for await (const output of this.runItem(cursor, item)) {
          if (buffer) {
            buffer.push(output);
          } else {
            yield complete(output);
          }
        }
      }
    } catch(e) {
      if (e.code != 'limit') {
        throw e;
      }
    } finally {
      const finished = await this._finish(cursor, index, buffer);
      for (const output of (finished || [])) {
        yield complete(output);
      }
    }
  }
}
