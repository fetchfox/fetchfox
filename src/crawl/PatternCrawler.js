import { BaseCrawler } from './BaseCrawler.js';
import { Mapper } from './Mapper.js';
import { Finder } from './Finder.js';
import { PriorityQueue } from './PriorityQueue.js'
import { createChannel, promiseAllStrict } from '../util.js';
import * as prompts from './prompts.js'

const clean = url => {
  const u = new URL(url);
  return u.origin + u.pathname;
}

export const PatternCrawler = class extends BaseCrawler {
  constructor(options) {
    super(options);
  }

  async *run(patterns, options) {
    const rootUrl = new URL(patterns[0]).origin;

    // Run mapper
    const onIteration = async () => {
      console.log(mapper.layoutString([rootUrl]));
    }
    const mapper = new Mapper(this);
    await mapper.run(
      rootUrl,
      { maxIterations: 0, onIteration });

    // Run finder
    const onFind = async (link) => {
      console.log('=> found link', link);
    }
    const finder = new Finder(mapper, this);
    await finder.run(
      patterns,
      { maxIterations: 200, onFind });
  }
};

const check = (url, startUrl) => {
  let u;
  try {
    u = new URL(url);
  } catch {
    return false;
  }

  if (u.origin != new URL(startUrl).origin) {
    return false;
  }

  return true;
}

const sift = (links, startUrl, state) => {
  const out = [];
  const seen = {};
  for (const link of links) {
    let u;
    try {
      u = new URL(link.url);
    } catch {
      continue;
    }

    // TODO: allow off-domain with restritions/limitations
    if (u.origin != startUrl.origin) {
      continue;
    }

    const y = clean(u.toString());
    if (state[y]) {
      continue;
    }
    if (seen[y]) {
      continue;
    }
    seen[y] = true;
    out.push({ ...link });
  }

  return out;
}
