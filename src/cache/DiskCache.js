import fs from 'fs';
import path from 'path';

export const DiskCache = class {
  constructor(dirname) {
    this.dirname = dirname;
    fs.promises.mkdir(dirname, { recursive: true });
  }

  async set(key, val, ttl) {
    const filepath = path.join(this.dirname, key);
    const data = { val, expiresAt: Date.now() + ttl * 1000 };
    return await fs.promises.writeFile(filepath, JSON.stringify(data), 'utf8');
  }

  async get(key) {
    const filepath = path.join(this.dirname, key);
    try {
      const file = await fs.promises.readFile(filepath, 'utf8');
      const data = JSON.parse(file);

      if (Date.now() > data.expiresAt || data.val === undefined) {
        await this.del(key);
        return null;
      }

      return data.val;
    } catch (e) {
      if (e.code == 'ENOENT') return null;
      throw e;
    }
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
