import { logger } from '../log/logger.js';
import { getAI, BaseAI } from '../ai/index.js';
import { getCrawler, BaseCrawler } from '../crawl/index.js';
import { getExtractor, BaseExtractor } from '../extract/index.js';
import { getFetcher, BaseFetcher } from '../fetch/index.js';
import { getActor, BaseActor } from '../act/index.js';
import { DiskCache } from '../cache/DiskCache.js';
import { copyKeys } from './constants.js';

// Order matters for `decodeableKeys`
export const decodeableKeys = [
  ['fetcher', getFetcher, BaseFetcher],
  ['ai', getAI, BaseAI],
  ['crawler', getCrawler, BaseCrawler],
  ['extractor', getExtractor, BaseExtractor],
  ['actor', getActor, BaseActor],
];


const decodeArgs = (args, cache) => {
  const decoded = {};
  decoded.publishAllSteps = args.publishAllSteps;

  if (args.diskCache) {
    args.cache = new DiskCache(args.diskCache);
  }
  if (args.cache) {
    decoded.cache = args.cache;
  }

  for (const [key, getter, parentClass] of decodeableKeys) {
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
      const useOptions = { ...decoded, cache, ...options };
      val = getter(which, useOptions);
    }
    decoded[key] = val;
  }

  for (const [key, initVal] of copyKeys) {
    const val = args && args[key] ? JSON.parse(JSON.stringify(args[key])) : initVal;
    decoded[key] = val;
  }

  return decoded;
}

export const Context = class {
  constructor(args) {
    args = args || {};

    const decoded = decodeArgs(args, this.cache);
    for (const key of Object.keys(decoded)) {
      this[key] = decoded[key];
    }

    this.args = args;
  }

  dump() {
    const dump = {};

    for (const [key] of copyKeys) {
      dump[key] = this[key];
    }

    for (const [key] of decodeableKeys) {
      if (this.args[key]) {
        dump[key] = this.args[key];
      }
    }

    return JSON.parse(JSON.stringify(dump));
  }

  update(other) {
    other = other || {};

    const combined = { ...this.args, ...other };
    const decoded = decodeArgs(combined);

    for (const key of Object.keys(decoded)) {
      this[key] = decoded[key];
    }

    this.args = combined;

    return this;
  }
}
