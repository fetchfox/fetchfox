import { logger } from '../log/logger.js';

export const BaseStep = class {
  static combineInfo = (info) => {
    const combined = {...info};
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

  async _finish(cursor, index, buffer) {
    if (!this.finish) throw new Error('invalid call');

    const out = await this.finish();
    if (!out) return buffer;

    const key = `Step${index + 1}_${this.constructor.name}`;
    for (let i = 0; i < out.length && i < buffer.length; i++) {
      const item = buffer[i];
      item[key] = out[i];
    }

    return buffer;
  }

  async *pipe(cursor, inputs, index) {
    let buffer;
    if (this.finish) {
      buffer = [];
    }

    const complete = (item) => {
      cursor.publish(index, item);
      return Promise.resolve(item);
    }

    try {
      for await (const item of inputs) {
        for await (const output of this.runItem(cursor, item)) {
          if (buffer) {
            buffer.push(output);
          } else {
            yield complete(output);
          }
        }
      }
    } finally {
      if (buffer) {
        const finished = await this._finish(cursor, index, buffer);
        for (const output of finished) {
          yield complete(output);
        }
      }
    }
  }
}
