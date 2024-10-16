import { getAI } from '../ai/index.js';
import { getCrawler } from '../crawl/index.js';
import { getExporter } from '../export/index.js';
import { getExtractor } from '../extract/index.js';
import { getFetcher } from '../fetch/index.js';
import { DiskCache } from '../cache/DiskCache.js';

export const contextKeys = [
  ['fetcher', getFetcher],
  ['ai', getAI],
  ['crawler', getCrawler],
  ['extractor', getExtractor],
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
    for (const [key, getter] of contextKeys) {
      let val;
      if (args && args[key]) {
        val = args[key];
      } else {
        val = getter(null, { ...this, cache });
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
