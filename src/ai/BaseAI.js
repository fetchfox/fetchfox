export const BaseAI = class {
  toString() {
    return `[${this.constructor.name} ${this.model}]`;
  }
}
