import fs from 'fs';
import path from 'path';
import { logger as defaultLogger } from '../log/logger.js';
import { BaseKV } from './BaseKV.js';

export const DiskKV = class extends BaseKV {
  constructor(dirname, options) {
    super();
    this.dirname = dirname;
    this.logger = options?.logger || defaultLogger;
    fs.promises.mkdir(dirname, { recursive: true });
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  async set(key, val) {
    const filepath = path.join(this.dirname, encodeURIComponent(key));
    try {
      await fs.promises.writeFile(filepath, JSON.stringify(val), 'utf8');
    } catch (e) {
      this.logger.error(`${this} Error writing key=${key}: ${e}`);
      throw e;
    }
  }

  async get(key) {
    const filepath = path.join(this.dirname, encodeURIComponent(key));
    try {
      const data = await fs.promises.readFile(filepath, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      if (e.code == 'ENOENT') {
        return undefined;
      }
      this.logger.error(`${this} Error reading key=${key}: ${e}`);
      throw e;
    }
  }

  async del(key) {
    const filepath = path.join(this.dirname, encodeURIComponent(key));
    try {
      await fs.promises.unlink(filepath);
    } catch (e) {
      if (e.code != 'ENOENT') {
        return
      }
      this.logger.error(`${this} Error deleting key=${key}: ${e}`);
      throw e;
    }
  }
}
