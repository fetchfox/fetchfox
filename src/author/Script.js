export const Script = class {
  constructor() {
    this.codes = [];
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  load(ser) {
    const obj = JSON.parse(ser);
    this.codes = obj.codes;
  }

  dump() {
    return JSON.stringify({ codes: this.codes });
  }

  push(...codes) {
    this.codes.push(...codes);
  }
}
