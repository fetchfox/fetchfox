import { logger as defaultLogger } from '../log/logger.js';
import { BaseKV } from './BaseKV.js';

export const MemKV = class extends BaseKV {
  constructor(options) {
    super();
    this.store = {};
    this.logger = options?.logger || defaultLogger;
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  async set(key, val) {
    this.store[key] = val;
  }

  async get(key) {
    return this.store[key];
  }

  async del(key) {
    delete this.store[key];
  }
}
