export const BaseStep = class {

  toString() {
    return `[${this.constructor.name}]`;
  }

  async full(cursor, args) {
    let result = [];
    for await (const r of this.run(cursor, args)) {
      result.push(r);
    }
    cursor.head = result;
    return result;
  }
}
