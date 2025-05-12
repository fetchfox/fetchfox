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

    this.fetcher.cache = null;

    this.signal = options?.signal;

    this.mapper = mapper;
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  async run(patterns, options) {
    this.logger.info(`${this} Find ${patterns.join(', ')}`);

    const maxIterations = options?.maxIterations || 10;

    console.log('maxIterations', maxIterations);
    // throw 'STOP maxIterations';

    const onFind = options?.onFind ? options?.onFind : () => {};

    const ev = {};
    const recordEv = (url, counts) => {
      const path = this.mapper.toPath(norm(url));
      const pattern = path.pattern;

      if (pattern) {
        ev[pattern] ||= { hits: [], patterns: {} };
        ev[pattern].hits.push(counts.hits || 0);

        const allPatterns = {};
        for (const p of Object.keys(ev[pattern].patterns)) {
          allPatterns[p] = true;
        }
        for (const p of Object.keys(counts.patterns)) {
          allPatterns[p] = true;
        }
        for (const p of Object.keys(allPatterns)) {
          ev[pattern].patterns[p] ||= [];
          ev[pattern].patterns[p].push(counts.patterns[p] || 0);
        }
      }
    }

    const score = (url, depth = 2, memo = {}) => {
      const path = this.mapper.toPath(norm(url));

      // const pattern = path.pattern || '<none>';
      const pattern = path.pattern;// || '<none>';
      const data = ev[pattern];

      if (data) {
        const lookback = (arr) => {
          const recent = data.hits.slice(-3);
          const sum = recent.reduce((acc, x) => acc + x, 0);
          return sum / recent.length;
        }
        const s = lookback(data.hits);
        if (s > 5) {
          return s;
        }
      }

      const distances = patterns.map(it => this.mapper.distance(url, it));
      const d = Math.min(3, ...distances);
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
      return true;
    }

    // const urls = this.mapper.urls;
    const suggestions = options?.suggestions || [];
    console.log('suggestions', suggestions);
    // const urls = [...suggestions, ...(this.mapper.urls || [])].map(norm).filter(Boolean);
    const urls = [...suggestions].map(norm).filter(Boolean);
    for (const pattern of patterns) {
      const url = new URL(pattern);
      urls.push(url.origin);
    }

    const pq = new PriorityQueue(score, this, { domain: domain(urls[0]) });

    console.log('urlsx', urls);
    urls.forEach(it => pq.add(it));

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

      if (this.signal?.aborted) {
        console.log('BREAK aborted');
        break;
      }

      while (q.size < concurrency && !pq.empty && count < maxIterations) {
        if (links.length == 0) {
          pq.sort();
          console.log('get links from pq');
          const l = await pq.shiftMany(
            64,
            -5,
            `Find urls matching any of these URL patterns:\n${patterns.join('\n')}`);

          // console.log('got l', l);
          links.push(...l);
        }

        const link = links.shift();
        count++;

        // console.log('links', links);

        const p = q.add(async () => {
          if (this.signal?.aborted) {
            console.log('aborted, bail out');
            return;
          }

          this.logger.debug(`${this} Visit count=${count} of max=${maxIterations}, url=${link.url}`);

          // Send the link itself
          await handleUrl(link.url);

          // Get the page and send all links we find

          // TODO: Re-enable pagination version

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

          // console.log('GETTING LINKS FROM', link.url);
          // for (const found of (doc?.links || [])) {
          //   console.log('--> url:', found.url);
          // }
          // throw 'STOP 111';

          let counts = {
            hits: 0,
            patterns: {}
          };
          for (const found of (doc?.links || [])) {
            // console.log('found.url', found.url);
            const ok = await handleUrl(found.url, link.url);
            if (ok) {
              counts.hits++;
            }
            const path = this.mapper.toPath(norm(found.url));
            if (path.pattern) {
              counts.patterns[path.pattern] ||= 0;
              counts.patterns[path.pattern]++;
            }
          }

          recordEv(link.url, counts);

          // console.log('EV', JSON.stringify(ev, null, 2));
          // throw 'STOP ev';
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
      // if (completed >= count) break;
      if (completed >= count && (pq.empty || count >= maxIterations)) {
        console.log('BREAK conditional');
        break;
      }

      console.log('sleep', count, pq.empty);
      await new Promise(ok => setTimeout(ok, 2000));
      console.log('sleep done', pq.empty);

      console.log('\n\n\t\t!!!!!!!', ((this.fetcher.usage?.bytes || 0) / 1e6).toFixed(4), 'MB');
      console.log('\t\t!!!!!!!', Object.keys(sent).length, 'hits');
      console.log('\n\n');
    }

    console.log('!!! finder done, wait for q promises');
    console.log('pq.empty?', pq.empty);
    console.log('count    ', count);
    console.log('max iter ', maxIterations);

    await promiseAllStrict(promises);

    console.log('pq.empty?', pq.empty);
    console.log('count    ', count);
    console.log('max iter ', maxIterations);

    // throw 'STOP finder done';
  }
}


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
