import { BaseKV } from './BaseKV.js';
import Redis from 'ioredis';

export const RedisKV = class extends BaseKV {
  constructor(options) {
    super(options);
    this.url = options.url || 'redis://127.0.0.1:6379';
  }

  async get(key) {
    const redis = new Redis(this.url);
    try {
      return JSON.parse(await redis.get(key));
    } finally {
      redis.quit();
    }
  }

  async set(key, val) {
    const redis = new Redis(this.url);
    try {
      return await redis.set(key, JSON.stringify(val));
    } finally {
      redis.quit();
    }
  }
};
