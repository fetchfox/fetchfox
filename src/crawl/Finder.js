import { logger as defaultLogger } from '../log/logger.js';
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

    for (let i = 0; i < maxIterations && !pq.empty; i++) {
      if (this.signal?.aborted) {
        break;
      }

      this.logger.debug(`${this} Finder iteration #${i} for ${patterns.join(', ')}`);

      console.log(this.mapper.layoutString());

      pq.sort();

      for (let i = 0; i < pq.list.length && i < 50; i++) {
        const item = pq.list[i];
      // for (const item of pq.list) {
        console.log('pq item:', item.score, item.url);
      }

      const links = await pq.shiftMany(
        64,
        -5,
        `Find urls matching any of these URL patterns:
${patterns.join('\n')}

To help with your search, reference this sitemap. Indentation shows the page layout hierarchy, and URL patterns and speicfic URLs are both shown:
${this.mapper.layoutString()}
`);

      const promises = [];

      for (const link of links) {
        await handleUrl(link.url);

        const p = new Promise(async (ok) => {
          if (this.signal?.aborted) {
            return;
          }

          this.logger.debug(`${this} Fetch ${link.url}, score=${score(link.url)}`);
          const doc = await this.fetcher.first(link.url);
          this.logger.debug(`${this} Got ${doc}`);

          for (const found of (doc?.links || [])) {
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
