import { BaseKV } from './BaseKV.js';

export const MemKV = class extends BaseKV {
  constructor(options) {
    super(options);
    this.data = {};
  }

  async get(key) {
    return this.data[key];
  }

  async set(key, val) {
    this.data[key] = val;
  }
}
