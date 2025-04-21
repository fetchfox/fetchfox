import PQueue from 'p-queue';
import { logger as defaultLogger } from '../log/logger.js';
import { promiseAllStrict } from '../util.js';
import { getAI } from '../ai/index.js'
import { getFetcher } from '../fetch/index.js'
import { PriorityQueue } from './PriorityQueue.js'
import { norm, domain } from './shared.js';
import * as prompts from './prompts.js';

export const Finder = class {
  constructor(mapper, options) {
    this.logger = options?.logger || defaultLogger;
    this.ai = options?.ai || getAI();
    this.fetcher = options?.fetcher || getFetcher();
    this.signal = options?.signal;

    this.mapper = mapper;
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  async run(patterns, options) {
    this.logger.info(`${this} Find ${patterns.join(', ')}`);

    const maxIterations = options?.maxIterations || 10;
    const onFind = options?.onFind ? options?.onFind : () => {};

    const score = (url) => {
      const distances = patterns.map(it => this.mapper.distance(url, it));
      const d = Math.min(...distances);

      // TODO: smarter expected value search
      if (d == 0) return -2;

      return -d;
    }

    const matches = (url) => {
      for (const pattern of patterns) {
        const re = new RegExp('^' + pattern.replaceAll('*', '.*') + '/?$');
        if (url.match(re)) {
          return true
        }
      }
      return false;
    }

    const sent = {};
    const seen = {};
    const handleUrl = async (url) => {
      if (seen[url]) {
        return;
      }
      seen[url] = true;

      const n = norm(url);
      pq.add(n);

      if (!matches(n)) {
        return;
      }
      if (sent[n]) {
        return;
      }
      sent[n] = true;

      await onFind(n);
    }

    const urls = this.mapper.urls;

    const pq = new PriorityQueue(score, this, { domain: domain(urls[0]) });
    urls.forEach(it => pq.add(it));
    for (const pattern of patterns) {
      const url = new URL(pattern);
      pq.add(url.origin);
    }

    let count = 0;
    let completed = 0;
    let links = [];
    const concurrency = 64;
    const q = new PQueue({ concurrency });
    let promises = [];

    while (true) {
      console.log('check...', q.size, pq.empty, concurrency);
      // for (let i = 0; i < maxIterations && !pq.empty; i++) {
      // console.log(`=== Iteration ${i} of ${maxIterations}, pq size ${pq.list.length} ===`);
      // this.logger.debug(`${this} Finder iteration #${i} for ${patterns.join(', ')}`);

      if (this.signal?.aborted) break;

      while (q.size < concurrency && !pq.empty && count < maxIterations) {
        if (links.length == 0) {
          pq.sort();
          console.log('get links from pq');
          const l = await pq.shiftMany(
            64,
            -5,
            `Find urls matching any of these URL patterns:\n${patterns.join('\n')}`);

          console.log('got l', l);
          links.push(...l);
        }

        const link = links.shift();
        count++;
        const p = q.add(async () => {
          if (this.signal?.aborted) return;

          this.logger.debug(`${this} Visit count=${count} of max=${maxIterations}, url=${link.url}`);

          // Send the link itself
          await handleUrl(link.url);

          // Get the page and send all links we find

          // let num = 0;
          // for await (let doc of this.fetcher.fetch(link.url, { maxPages: 1 })) {
          //   this.logger.debug(`${this} Got #${++num} ${doc}`);
          //   for (const found of (doc?.links || [])) {
          //     await handleUrl(found.url);
          //   }
          // }
          // this.logger.debug(`${this} Processed total of ${num} documents`);


          this.logger.debug(`${this} Fetch ${link.url}, score=${score(link.url)}`);
          const doc = await this.fetcher.first(link.url);
          this.logger.debug(`${this} Got ${doc}`);
          for (const found of (doc?.links || [])) {
            await handleUrl(found.url);
          }

          completed++;
        });

        p
          .then(() => {
            completed++
            this.logger.debug(`${this} Finished visit of ${link.url}, count=${count}, completed=${completed}, max=${maxIterations}`);
          })
          .catch((e) => {
            this.logger.error(`${this} Finished visit of ${link.url} with error, count=${count}, completed=${completed}, max=${maxIterations}, error: ${e}`);
            completed++
            throw e;
          });

        promises.push(p);
      }
      console.log('check 2...', completed, count);
      if (completed >= count) break;

      console.log('sleep', count, pq.empty);
      await new Promise(ok => setTimeout(ok, 5000));

    }

    console.log('!!! finder done, wait for q promises');

    await promiseAllStrict(promises);

      // TODO: consider restoring this. For now it is too many tokens and may not actually help
// To help with your search, reference this sitemap. Indentation shows the page layout hierarchy, and URL patterns and specific URLs are both shown:
// ${this.mapper.layoutString()}


      // const promises = [];
      // let count = 0
      // for (const link of links) {
      //   await handleUrl(link.url);
      //   const p = new Promise(async (ok) => {
      //     if (this.signal?.aborted) {
      //       return;
      //     }
      //     console.log('Finder exec', count++, link.url)
      //     this.logger.debug(`${this} Fetch ${link.url}, score=${score(link.url)}`);
      //     const doc = await this.fetcher.first(link.url);
      //     this.logger.debug(`${this} Got ${doc}`);
      //     for (const found of (doc?.links || [])) {
      //       handleUrl(found.url);
      //     }
      //     ok();
      //   });
      //   promises.push(p);
      // }
      // await Promise.allSettled(promises);
  }
}
