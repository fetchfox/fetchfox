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

    // console.log('this.ai.cache PC', this.ai.cache);
    // throw 'STOP1';
  }

  async *run(patterns, options) {
    console.log('PC cache', this.cache);
    this.logger.trace('!!');
    // throw 'STOP';

    const suggestions = options?.suggestions || [];

    const mapperHint = `The user is crawling for URLs that fit these patterns: ${patterns.join('\n')}. Try to map out areas of the site that will help find these patterns.`;

    const rootUrl = new URL(patterns[0]).origin;
    const urls = [rootUrl, ...suggestions];
    console.log('options', options);

    // Start mapper
    const onIteration = async () => {
      console.log('');
      console.log('== latest map ==');
      console.log(mapper.layoutString(urls));
      console.log('== latest examples ==');
      console.log(mapper.examplesString(5));
      // throw 'STOP on inter';
    }
    const mapper = new Mapper(this);
    const mapPromise = mapper.run(
      urls,
      { maxIterations: 4, hint: mapperHint, onIteration });

    // await mapPromise;
    // console.log('== FINAL map ==');
    // console.log(mapper.layoutString(urls));

    // throw 'STOP map done';

    // Run finder concurrently with mapper
    const found = [];
    const onFind = async (url) => {
      found.push(url);
      this.logger.info(`${chalk.green('\u{25CF}')} Found url (${found.length}): ${url}`);
    }
    const finder = new Finder(mapper, this);
    await finder.run(
      patterns,
      { maxIterations: 10, onFind });
    await mapPromise;
    console.log('found:', found);
    console.log('found len', found.length);
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
