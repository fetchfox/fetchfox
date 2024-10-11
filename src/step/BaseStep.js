import { logger } from '../log/logger.js';

export const BaseStep = class {
  static combineInfo = (info) => {
    const combined = {...info};
    combined.args.limit = {
      description: 'Limit the number of results in this step. Format: Number',
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

  async _finish(cursor) {
    if (!this.finish) return;

    const out = await this.finish();
    if (!out) return;

    const key = `Step${cursor.index}_${this.constructor.name}`;
    for (let i = 0; i < out.length && i < cursor.head.length; i++) {
      const item = cursor.head[i];
      item[key] = out[i];
    }
  }

  async *stream(cursor) {
    cursor.head = [];
    try {
      for await (const r of this.run(cursor)) {
        cursor.head.push(r);
        yield Promise.resolve(r);
        logger.info(`Step found ${cursor.head.length} items, limit is ${this.limit || '(no limit)'}`);
        if (this.limit && cursor.head.length >= this.limit) break;
      }
    } finally {
      cursor.last = cursor.head;
      await this._finish(cursor);
    }
  }

  async all(cursor) {
    cursor.head = [];
    try {
      for await (const r of this.run(cursor)) {
        cursor.head.push(r);
        logger.info(`Step found ${cursor.head.length} items, limit is ${this.limit || '(no limit)'}`);
        if (this.limit && cursor.head.length >= this.limit) break;
      }
    } finally {
      cursor.last = cursor.head;
      await this._finish(cursor);
    }
  }
}
