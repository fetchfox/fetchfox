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
    const result = {...a};
    if (this.limit) result.limit = this.limit;
    return result;
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
    if (out) {
      const key = `Step${cursor.index}_${this.constructor.name}`;
      for (const item of cursor.head) {
        item[key] = out;
      }
    }
  }

  async *stream(cursor) {
    cursor.head = [];
    try {
      for await (const r of this.run(cursor)) {
        cursor.head.push(r);
        yield Promise.resolve(r);
        logger.info(`Step found ${cursor.head.length} items, limit is ${this.limit}`);
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
        logger.info(`Step found ${cursor.head.length} items, limit is ${this.limit}`);
        if (this.limit && cursor.head.length >= this.limit) break;
      }
    } finally {
      cursor.last = cursor.head;
      await this._finish(cursor);
    }
  }
}
