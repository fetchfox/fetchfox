import { logger } from '../log/logger.js';

export const MultiCache = class {
  constructor(caches) {
    // Order matters: caches are checked in order, and results
    // from later caches are filled in to earlier ones.
    this.caches = caches;
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  async set(key, val, label) {
    logger.info(`${this} Set caches ${key}: ${this.caches.map(c => '' + c)}`);

    try {
      await Promise.allSettled(this.caches.map(c => c.set(key, val, label)));
    } catch (e) {
      logger.error(`${this} Error while setting caches: ${e}`);
      throw e;
    }
  }

  async get(key) {
    logger.info(`${this} Get from caches: ${this.caches.map(c => '' + c)}`);

    let result;
    let i;
    for (i = 0; i < this.caches.length; i++) {
      const cache = this.caches[i];
      try {
        result = await cache.get(key);
      } catch (e) {
        logger.error(`${this} Error while getting from cache ${cache}: ${e}`);
        throw e;
      }

      if (result) {
        break;
      }
    }

    const promises = [];
    for (let j = 0; j < i; j++) {
      const cache = this.caches[j];
      promises.push(cache.set(key, result));
    }
    
    try {
      await Promise.allSettled(this.caches.map(c => c.set(key, result)));
    } catch (e) {
      logger.error(`${this} Error while setting caches in get: ${e}`);
      throw e;
    }

    return result;
  }

  async del(key) {
    logger.info(`${this} Delete from caches ${key}: ${this.caches.map(c => '' + c)}`);

    try {
      await Promise.allSettled(this.caches.map(c => c.del(key, val, label)));
    } catch (e) {
      logger.error(`${this} Error while deleting from caches: ${e}`);
      throw e;
    }
  }
}
