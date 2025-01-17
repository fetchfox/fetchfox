import { logger } from "../log/logger.js";
import { Timer } from "../log/timer.js";
import { Document } from "../document/Document.js";
import { shortObjHash } from "../util.js";

export const BaseMinimizer = class {
  constructor(options) {
    this.cache = (options || {}).cache;
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  async cacheKey(doc, options) {
    const dump = await doc.dump();
    const hash = shortObjHash({ doc: dump, options });
    return `min-${this.constructor.name}-${doc.url.replace(/\//g, "-").substr(0, 100)}-${hash}`;
  }

  async getCache(doc, options) {
    if (!this.cache) return;
    if (!doc) return;

    let key;
    try {
      key = await this.cacheKey(doc, options);
    } catch (e) {
      logger.error(`${this} Error getting cache key ${doc}: ${e}`);
      return;
    }
    let result;
    try {
      result = await this.cache.get(key);
    } catch (e) {
      logger.error(`${this} Error getting cache ${key}: ${e}`);
      return;
    }
    const outcome = result ? "(hit)" : "(miss)";
    logger.debug(`Minimizer cache ${outcome} for ${doc}`);

    if (!result) return;

    const min = new Document();
    try {
      await min.loadData(result);
    } catch (e) {
      logger.error(`${this} Error loading data ${doc}: ${e}`);
      return;
    }
    return min;
  }

  async setCache(doc, options, min) {
    if (!this.cache) return;
    if (!doc) return;

    let key;
    try {
      key = await this.cacheKey(doc, options);
    } catch (e) {
      logger.error(`${this} Error getting cache key ${doc}: ${e}`);
      return;
    }
    logger.debug(`Set minimizer cache for ${doc}`);
    return this.cache.set(key, await min.dump(), "min");
  }

  async min(doc, options) {
    const timer = options?.timer || new Timer();
    timer.push("Template.renderCappedFromMemory");

    const cacheOptions = { removeTags: this.removeTags };
    let cached;
    try {
      cached = await this.getCache(doc, cacheOptions);
    } catch (e) {
      logger.error(`${this} Error getting cache: ${e}`);
    }
    if (cached) return cached;
    if (!doc) return;

    timer.push(`${this}.min`);

    const before = JSON.stringify([doc.html, doc.text]).length;
    let min;
    try {
      min = await this._min(doc);
    } catch (e) {
      logger.error(`${this} Error running min ${doc}: ${e}`);
      throw e;
    }
    const after = JSON.stringify([min.html, min.text]).length;

    timer.pop();

    logger.info(
      `Minimized doc from ${(before / 1000).toFixed(1)} kB -> ${(after / 1000).toFixed(1)} kB`,
    );

    this.setCache(doc, cacheOptions, min).catch((e) => {
      logger.error(`${this} Error caching: ${e}`);
    });

    return min;
  }
};
