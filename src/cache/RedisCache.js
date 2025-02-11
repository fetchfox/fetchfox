import Redis from 'ioredis';
import { logger } from '../log/logger.js';

export const RedisCache = class {
  constructor(url, options) {
    const { ttls } = options || {};
    this.redis = new Redis(url);
    this.ttls = ttls || {};
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  _cleanKey(key) {
    return key.replaceAll('/', '-');
  }

  async set(key, val, label) {
    key = this._cleanKey(key);

    const ttl = this.ttls[label] || this.ttls.base || 2 * 3600; // Default TTL: 2 hours
    const data = JSON.stringify({ val });
    if (ttl > 0) {
      await this.redis.set(key, data, 'EX', ttl);
    } else {
      await this.redis.set(key, data);
    }
  }

  async get(key) {
    key = this._cleanKey(key);

    let data;
    try {
      const result = await this.redis.get(key);
      if (!result) return null;

      data = JSON.parse(result);
    } catch (e) {
      logger.warn(`Failed to parse JSON for cache key ${key}: ${e}`);
      await this.del(key);
      return null;
    }

    return data.val || null;
  }

  async del(key) {
    key = this._cleanKey(key);

    try {
      await this.redis.del(key);
    } catch (e) {
      logger.error(`Failed to delete key ${key} from Redis: ${e}`);
      throw e;
    }
  }
};
