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


const decodeArgs = (args, cache) => {
  const decoded = {};
  decoded.publishAllSteps = args.publishAllSteps;

  if (args.diskCache) {
    args.cache = new DiskCache(args.diskCache);
  }
  if (args.cache) {
    decoded.cache = args.cache;
  }

  for (const [key, getter, parentClass] of contextKeys) {
    let val;
    let which = null;
    let options = {};

    console.log('DECODE', key, args[key]);

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
      console.log('CALLING GETTER');
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
    // TODO: stringify objects as well
    for (const key of copyKeys) {
      dump[key] = this[key];
    }
    return JSON.parse(JSON.stringify(dump));
  }

  update(other) {
    other = other || {};

    const combined = { ...this.args, ...other };

    console.log('COMBINED-->', combined);

    const decoded = decodeArgs(combined);

    for (const key of Object.keys(decoded)) {
      this[key] = decoded[key];
    }

    this.args = combined;

    return this;
  }
}
