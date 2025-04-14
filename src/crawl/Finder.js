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

    const pq = new PriorityQueue(score);
    urls.forEach(it => pq.add(it));

    for (let i = 0; i < maxIterations && !pq.empty; i++) {
      // console.log('iter', i);

      const link = pq.shift();
      handleUrl(link.url);

      // for (const x of pq.list) {
      //   console.log('x=>', score(x.url), x);
      // }

      const doc = await this.fetcher.first(link.url);
      for (const found of doc.links) {
        handleUrl(found.url);
      }
    }
  }
}
