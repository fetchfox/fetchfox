import { getFetcher } from '../fetch/index.js'
import { PriorityQueue } from './PriorityQueue.js'
import { norm } from './shared.js ';
import * as prompts from './prompts.js';

export const Finder = class {
  constructor(mapper, options) {
    this.mapper = mapper;
    this.fetcher = options?.fetcher || getFetcher();
  }

  async run(patterns, options) {
    console.log('*find', patterns);
    const maxIterations = options?.maxIterations || 10;
    const onFind = options?.onFind ? options?.onFind : () => {};

    const score = (url) => {
      const distances = patterns.map(it => this.mapper.distance(url, it));
      return -Math.min(...distances);
    }

    const sent = {};
    const handleUrl = (url) => {
      const n = norm(url);
      pq.add(n);

      if (Math.abs(score(n)) != 0) {
        return;
      }
      if (sent[n]) {
        return;
      }
      sent[n] = true;
      onFind(n);
    }

    const urls = this.mapper.urls;

    const pq = new PriorityQueue(score, this);
    urls.forEach(it => pq.add(it));
    for (const pattern of patterns) {
      const url = new URL(pattern);
      pq.add(url.origin);
    }

    for (let i = 0; i < maxIterations && !pq.empty; i++) {
      console.log('Iteration', i);

      // const link = pq.shift();
      const links = await pq.shiftMany(
        10,
        -5,
        `Find urls matching any of these URL patterns:\n${patterns.join('\n')}`);

      // for (const x of pq.list) {
      //   console.log('x=>', score(x.url), x);
      // }
      console.log('links', links);

      const promises = [];

      for (const link of links) {
        console.log('link ->', link.url, score(link.url));
        handleUrl(link.url);

        const p = new Promise(async (ok) => {
          console.log('Fetch', link.url);
          const doc = await this.fetcher.first(link.url);
          console.log('Fetch got: ' + doc);
          for (const found of doc.links) {
            // console.log('found url:', found.url);
            handleUrl(found.url);
          }
          ok();
        });

        promises.push(p);
      }

      await Promise.allSettled(promises);
    }
  }
}
