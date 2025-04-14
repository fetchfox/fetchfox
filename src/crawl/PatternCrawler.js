import chalk from 'chalk';
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
    const suggestions = options?.suggestions || [];

    const mapperHint = `The user is crawling for URLs that fit these patterns: ${patterns.join('\n')}. Try to map out areas of the site that will help find these patterns.`;

    const rootUrl = new URL(patterns[0]).origin;
    const urls = [rootUrl, ...suggestions];

    // Start mapper
    const onIteration = async (i) => {
      this.logger.debug(`${this} Layout on iteration ${i}:\n${mapper.layoutString(urls)}`);
    }
    const mapper = new Mapper(this);
    const mapPromise = mapper.run(
      urls,
      { maxIterations: 4, hint: mapperHint, onIteration });

    // Run finder concurrently with mapper
    const urlsChan = createChannel();

    const found = [];
    const onFind = async (url) => {
      found.push(url);
      this.logger.info(`${chalk.green('\u{25CF}')} Found url (${found.length}): ${url}`);
      urlsChan.send({ url });
    }
    const finder = new Finder(mapper, this);
    const findPromise = finder
      .run(
        patterns,
        { maxIterations: 10, onFind })
      .then(() => urlsChan.end())
      .catch((e) => {
        urlsChan.end();
        throw e;
      });

    // Read from channel
    for await (const val of urlsChan.receive()) {
      if (val.end) {
        break;
      }

      yield Promise.resolve(val);
    }

    await findPromise;
    await mapPromise;
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
