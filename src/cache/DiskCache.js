import fs from 'fs';
import path from 'path';
import { logger } from '../log/logger.js';

export const DiskCache = class {
  constructor(dirname, options) {
    const { ttls } = options || {};
    this.dirname = dirname;
    this.ttls = ttls || {};
    fs.promises.mkdir(dirname, { recursive: true });
  }

  async set(key, val, label) {
    const filepath = path.join(this.dirname, key);
    const ttl = this.ttls[label] || this.ttls.base || 24 * 3600;
    const data = { val, expiresAt: Date.now() + ttl * 1000 };
    return await fs.promises.writeFile(filepath, JSON.stringify(data), 'utf8');
  }

  async get(key) {
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
      logger.error(`Failed to parse JSON for cache file ${filepath}:`, e);
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
    const filepath = path.join(this.dirname, key);
    try {
      await fs.promises.unlink(filepath);
    } catch (e) {
      if (e.code != 'ENOENT') return;
      throw e;
    }
  }
}
