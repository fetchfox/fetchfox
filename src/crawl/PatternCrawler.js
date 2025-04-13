import { BaseCrawler } from './BaseCrawler.js';
import { Mapper } from './Mapper.js'
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
    console.log('pc run', patterns);

    const rootUrl = new URL(patterns[0]).origin;

    const mapper = new Mapper(this);

    const onIteration = async () => {
      console.log(mapper.layoutString([rootUrl]));
    }

    await mapper.map(
      rootUrl,
      { maxIterations: 3, onIteration });

    console.log('mapper found these urls', mapper.urls);

    // const finder = new Finder(this);

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
