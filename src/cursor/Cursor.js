import { Context } from '../context/Context.js';

export const Cursor = class {
  constructor(args) {
    this.ctx = new Context(args);
  }
}
