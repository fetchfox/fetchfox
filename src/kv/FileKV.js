import { BaseKV } from './BaseKV.js';
import fs from 'fs/promises';

export const FileKV = class extends BaseKV {
  constructor(options) {
    super(options);
    this.path = options.path;
    this.load();
  }

  async load() {
    try {
      const content = await fs.readFile(this.path, 'utf8');
      this.data = JSON.parse(content);
    } catch (e) {
      if (e.code === 'ENOENT') {
        this.data = {};
        return;
      }

      throw e;
    }
  }

  async save() {
    await fs.writeFile(this.path, JSON.stringify(this.data, null, 2), 'utf8');
  }

  async get(key) {
    if (!this.data) {
      await this.load();
    }
    return this.data[key];
  }

  async set(key, val) {
    this.data[key] = val;
    await this.save();
  }
};
