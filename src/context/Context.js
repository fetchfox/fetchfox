import { logger as defaultLogger } from '../log/logger.js';
import { getAI, BaseAI } from '../ai/index.js';
import { getCrawler, BaseCrawler } from '../crawl/index.js';
import { getExtractor, BaseExtractor } from '../extract/index.js';
import { getFetcher, BaseFetcher } from '../fetch/index.js';
import { DiskCache } from '../cache/DiskCache.js';
import { S3Cache } from '../cache/S3Cache.js';
import { copyKeys } from './constants.js';

// Order matters for `decodeableKeys`
export const decodeableKeys = [
  ['ai', getAI, BaseAI],
  ['fetcher', getFetcher, BaseFetcher],
  ['crawler', getCrawler, BaseCrawler],
  ['extractor', getExtractor, BaseExtractor],
];

const decodeArgs = (args, cache) => {
  const logger = args?.logger || defaultLogger;

  const decoded = {};
  decoded.publishAllSteps = args.publishAllSteps;
  decoded.signal = args.signal;
  decoded.cache = cache;
  decoded.logger = logger;

  const diskCache = args.diskCache || process.env.DISK_CACHE;
  if (diskCache) {
    args.cache = new DiskCache(diskCache, { logger });
  }
  const s3Cache = args.s3Cache;
  if (s3Cache) {
    args.cache = new S3Cache(s3Cache, { logger });
  }
  if (args.cache) {
    args.cache.logger = logger;
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
      const useOptions = { ...decoded, logger, cache: decoded.cache, ...options };
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
    this.logger = args?.logger || defaultLogger;
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
    if (this.args.logger) {
      this.logger = this.args.logger;
    }

    return this;
  }
}
