export const BaseStep = class {
  static combineInfo = (info) => {
    const combined = {...info};
    combined.args.limit = {
      description: 'Limit the number of results in this step. Format: Number',
      example: 5,
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

  async *stream(cursor) {
    cursor.head = [];
    try {
      for await (const r of this.run(cursor)) {
        cursor.head.push(r);
        yield Promise.resolve(r);
        if (this.limit && cursor.head.length >= this.limit) break;
      }
    } finally {
      this.finish && this.finish();
      cursor.last = cursor.head;
    }
  }

  async all(cursor) {
    cursor.head = [];
    for await (const r of this.run(cursor)) {
      cursor.head.push(r);
    }
    cursor.last = cursor.head;
    return result;
  }
}
