import { getAI, BaseAI } from '../ai/index.js';
import { getCrawler, BaseCrawler } from '../crawl/index.js';
import { getExtractor, BaseExtractor } from '../extract/index.js';
import { getFetcher, BaseFetcher } from '../fetch/index.js';
import { DiskCache } from '../cache/DiskCache.js';
import { copyKeys } from './constants.js';

// Order matters for `contextKeys`
export const contextKeys = [
  ['fetcher', getFetcher, BaseFetcher],
  ['ai', getAI, BaseAI],
  ['crawler', getCrawler, BaseCrawler],
  ['extractor', getExtractor, BaseExtractor],
];

export const Context = class {
  constructor(args) {
    this.publishAllSteps = args?.publishAllSteps;

    if (args?.diskCache) {
      args.cache = new DiskCache(args?.diskCache);
    }

    if (args.cache) this.cache = args.cache;

    for (const [key, getter, parentClass] of contextKeys) {
      let val;
      let which = null;
      let options = {};

      if (args && args[key]) {
        const v = args[key];
        if (typeof v == 'string') {
          which = v;
        } else if (Array.isArray(v)) {
          [which, options] = v;
        } else if (v instanceof parentClass) {
          val = v;
        } else if (v instanceof Object) {
          options = v;
        }
      }

      if (!val) {
        const useOptions = { ...this, cache: this.cache, ...options };
        val = getter(which, useOptions);
      }
      this[key] = val;
    }

    for (const [key, initVal] of copyKeys) {
      const val = args && args[key] ? JSON.parse(JSON.stringify(args[key])) : initVal;
      this[key] = val;
    }
  }

  dump() {
    const ctx = {};
    for (const [key] of copyKeys) {
      ctx[key] = this[key];
    }
    // TODO: stringify contextKeys as well
    return ctx;
  }

  update(other) {
    other = other || {};

    for (const [key] of contextKeys) {
      if (other[key]) {
        this[key] = other[key];
      }
    }

    // Update tokens
    for (const [key, initVal] of copyKeys) {
      const val = other && other[key] ? JSON.parse(JSON.stringify(other[key])) : initVal;
      this[key] = val;
    }
    // for (const key of Object.keys(other.tokens || {})) {
    //   this.tokens[key] = other.tokens[key];
    // }
    // if (other.user) this.user = JSON.parse(JSON.stringify(other.user));

    if (other.cache) {
      this.cache = other.cache;
      for (const [key] of contextKeys) {
        this[key].cache = this.cache;
      }
    }

    return this;
  }
}
