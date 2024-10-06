export const BaseStep = class {
  constructor(args) {
    this.limit = args?.limit;
  }

  toString() {
    return `[${this.constructor.name}]`;
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
