import { getAI, BaseAI } from '../ai/index.js';
import { getCrawler, BaseCrawler } from '../crawl/index.js';
import { getExtractor, BaseExtractor } from '../extract/index.js';
import { getFetcher, BaseFetcher } from '../fetch/index.js';
import { DiskCache } from '../cache/DiskCache.js';

export const contextKeys = [
  ['ai', getAI, BaseAI],
  ['crawler', getCrawler, BaseCrawler],
  ['extractor', getExtractor, BaseExtractor],
  ['fetcher', getFetcher, BaseFetcher],
];

const copyKeys = [
  ['tokens', {}],
];

export const Context = class {
  constructor(args) {
    if (args?.diskCache) {
      args.cache = new DiskCache(args?.diskCache);
    }

    const cache = args?.cache;
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

      console.log('val is:', val);
      if (!val) {
        console.log('call getter with', which, options);
        val = getter(which, { ...this, cache, ...options });
      }
      this[key] = val;
    }

    // Copy tokens
    this.user = args?.user || null
    this.tokens = args?.tokens || {};
  }

  update(other) {
    other = other || {};

    for (const [key] of contextKeys) {
      if (other[key]) {
        this[key] = other[key];
      }
    }

    // Update tokens
    for (const key of Object.keys(other.tokens || {})) {
      this.tokens[key] = other.tokens[key];
    }

    if (other.user) this.user = JSON.parse(JSON.stringify(other.user));

    if (other.cache) {
      for (const [key] of contextKeys) {
        this[key].cache = other.cache;
      }
    }

    return this;
  }
}
