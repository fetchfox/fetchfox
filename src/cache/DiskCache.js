import { logger as defaultLogger } from '../log/logger.js';
import fs from 'fs';
import path from 'path';

export const DiskCache = class {
  constructor(dirname, options) {
    const { ttls } = options || {};
    this.logger = options.logger || defaultLogger;
    this.dirname = dirname;
    this.ttls = ttls || {};
    fs.promises.mkdir(dirname, { recursive: true });
    this.readOnly = options?.readOnly;
    this.writeOnly = options?.writeOnly;
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  _cleanKey(key) {
    return key.replaceAll('/', '-');
  }

  async set(key, val, label) {
    if (this.readOnly) {
      return;
    }

    key = this._cleanKey(key);

    const filepath = path.join(this.dirname, key);
    const ttl = this.ttls[label] || this.ttls.base || 2 * 3600;
    const data = { val, expiresAt: Date.now() + ttl * 1000 };
    return await fs.promises.writeFile(filepath, JSON.stringify(data), 'utf8');
  }

  async get(key) {
    if (this.writeOnly) {
      return;
    }

    key = this._cleanKey(key);

    const filepath = path.join(this.dirname, key);
    let file;
    try {
      file = await fs.promises.readFile(filepath, 'utf8');
    } catch (e) {
      if (e.code == 'ENOENT') return null;
      throw e;
    }

    let data;
    try {
      data = JSON.parse(file);
    } catch(e) {
      this.logger.warn(`Failed to parse JSON for cache file ${filepath}: ${e}`);
      this.del(key);
      return null;
    }

    if (Date.now() > data.expiresAt || data.val == undefined) {
      this.del(key);
      return null;
    }

    return data.val;
  }

  async del(key) {
    key = this._cleanKey(key);

    const filepath = path.join(this.dirname, key);
    try {
      await fs.promises.unlink(filepath);
    } catch (e) {
      if (e.code == 'ENOENT') return;
      throw e;
    }
  }
}
