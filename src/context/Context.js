import { getAI } from '../ai/index.js';
import { getCrawler } from '../crawl/index.js';
import { getExporter } from '../export/index.js';
import { getExtractor } from '../extract/index.js';
import { getFetcher } from '../fetch/index.js';

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

    if (other.cache) {
      for (const [key] of contextKeys) {
        this[key].cache = other.cache;
      }
    }

    return this;
  }
}
