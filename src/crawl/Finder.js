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
    console.log('* run find:', patterns);
    const maxIterations = options?.maxIterations || 10;
    const onFind = options?.onFind ? options?.onFind : () => {};

    const score = (url) => {
      const distances = patterns.map(it => this.mapper.distance(url, it));
      return -Math.min(...distances);
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
    const handleUrl = (url) => {
      const n = norm(url);
      // console.log('Finder handle:', n, matches(n));
      pq.add(n);

      if (!matches(n) || sent[n]) {
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
      const links = await pq.shiftMany(
        9999,
        -5,
        `Find urls matching any of these URL patterns:
${patterns.join('\n')}

To help with your search, reference this sitemap. Indentation shows the page layout hierarchy, and URL patterns and speicfic URLs are both shown:
${this.mapper.layoutString()}
`);

      const promises = [];

      for (const link of links) {
        console.log('Finder visit: link ->', link.url, score(link.url));
        handleUrl(link.url);

        const p = new Promise(async (ok) => {
          console.log('Finder Fetch', link.url);
          const doc = await this.fetcher.first(link.url);
          console.log('Finder got: ' + doc);
          for (const found of doc.links) {
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
