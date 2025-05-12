import { flat } from 'radash'
import { BaseCrawler } from './BaseCrawler.js';
import { parse } from 'node-html-parser';
import { norm } from './shared.js';
import * as prompts from './prompts.js';

export const PatternCrawler2 = class extends BaseCrawler {
  constructor(options) {
    super(options);
  }

  async *run(patterns, options) {
    this.logger.info(`${this} Look for patterns: ${patterns.join(', ')}`);

    const pattern = patterns[0];
    const top = new URL(pattern).origin;

    const candidates = [
      // top,
      // top + '/en.sitemap.xml',
      // top + '/sitemap.xml',

      'https://www.cos.com/en_usd/women/bags.html',
    ];

    // const doc1 = await this.fetcher.first('https://www.cos.com/en_usd/women/bags.html', { wait: 5000 });
    // for (const link of doc1.links) {
    //   console.log('link', link.url);
    // }

    const regex = new RegExp(/https:\/\/www\.cos\.com\/en_usd\/.*\/product\..*/);
    const check = (url) => {
      const u = norm(url);
      try {
        return u.match(regex);
      } catch {
        return false;
      }
    }

    const results = {};
    const maybePush = (url) => {
      const u = norm(u);
      if (results[u]) {
        return;
      }
      if (!u.match(regex)) {
        return;
      }
      results[u] = true;
      return true;
    }

    const seen = {};

    const costPerGb = 5;
    const revPer1k = 1;
    const iterations = 10;

    let outcomes = [];

    for (let i = 0; i < iterations; i++) {
      const before = {
        hits: Object.keys(results).length,
        bytes: this.fetcher.usage.bytes,
      }

      const iter = await this.nextUrls(candidates, pattern, 32, outcomes);

      const promises = iter.map(it => this.visit(it));
      const answers = await Promise.allSettled(promises);

      for (let j = 0; j < iter.length; j++) {
        const url = iter[j];
        const answer = answers[j];

        if (answer.status != 'fulfilled') {
          this.logger.warn(`${this} Got rejection for ${url}`);
          continue;
        }

        const urls = answer.value;

        let repeats = 0;
        let hits = 0;

        for (const url of urls) {
          const u = norm(url);

          if (check(u)) {
            if (results[u]) {
              repeats++;
            } else {
              results[u] = true;
              hits++;
            }
          }

          if (!seen[u] && !candidates.includes(u)) {
            candidates.push(u);
          }
        }

        console.log(`iter=${i} hits=${hits} repeats=${repeats} for ${url}`);

        outcomes.push({ url, hits, repeats });
      }

      const after = {
        hits: Object.keys(results).length,
        bytes: this.fetcher.usage.bytes,
      };

      const delta = {
        hits: after.hits - before.hits,
        bytes: after.bytes - before.bytes,
      };

      console.log('before:', before);
      console.log('after: ', after);
      console.log('delta: ', delta);
      // console.log('outcomes', outcomes);

      const rev = (delta.hits / 1000) * revPer1k;
      const cost = (delta.bytes / 1e9) * costPerGb;

      console.log(`delta on iter ${i}: ${delta.hits} hits, ${(delta.bytes / 1e6).toFixed(3)} MB. cost=\$${cost.toFixed(4)}, rev=\$${rev.toFixed(4)}`);
    }

    // console.log('results', Object.keys(results));
    console.log('final results len', Object.keys(results).length);

    throw 'STOP 111';
  }

  async visit(url) {
    const origin = new URL(url).origin;

    const doc = await this.fetcher.first(url, { wait: 1 });

    const urls = [];
    const maybePush = (u) => {
      try {
        const candidate = new URL(u);
        if (candidate.origin == origin) {
          urls.push(candidate.toString());
        }
      } catch {
        // no-op
      }
    }

    const root = parse(doc.html);
    for (const el of root.querySelectorAll('sitemap loc')) {
      maybePush(el.innerHTML);
    }

    for (const link of doc.links) {
      // console.log('link', link.url);
      maybePush(link.url);
    }

    return urls;
  }

  async nextUrls(candidates, pattern, limit, outcomes) {
    // return this.nextUrlsShift(candidates, pattern, limit, outcomes);
    return this.nextUrlsPrompt(candidates, pattern, limit, outcomes);
  }

  nextUrlsShift(candidates, pattern, limit, outcomes) {
    const seen = {};
    outcomes.forEach(it => seen[it.url] = true);

    const iter = [];
    while (candidates.length) {
      const url = candidates.shift();
      if (seen[url]) {
        continue;
      }
      seen[url] = true;
      iter.push(url);
      if (iter.length >= limit) {
        break;
      }
    }
    return iter;
  }

  async nextUrlsPrompt(candidates, pattern, limit, outcomes) {
    const seen = {};
    outcomes.forEach(it => seen[it.url] = true);

    const context = {
      urls: candidates.filter(it => !seen[it]).sort().join('\n'),
      outcomes: (JSON.stringify(outcomes.slice(-(limit * 2)), null, 2)),
      // outcomes: '[]',
      pattern,
      limit,
    };

    const { prompt } = await prompts.pattern2.renderCapped(context, 'urls', this.ai.advanced);
    // console.log('prompt', prompt);

    console.log('ask ai for next urls', limit);

    const answer = await this.ai.ask(prompt, { format: 'text' });
    console.log('answer->', answer.partial);

    const iter = answer.partial
      .split('\n')
      .map(norm)
      .filter(Boolean);

    const repeats = iter.filter(it => seen[it]);
    console.log('AI gave repeats:', repeats.length);

    console.log('ai prompt gave iter', iter);

    return iter;
  }
};
