import { logger } from '../log/logger.js';
import { validate, normalize, linkChunks, decodeLinks } from './util.js';
import { BaseCrawler } from './BaseCrawler.js';
import { rate, categorize, score } from './prompts.js';

export const DeepCrawler = class extends BaseCrawler {
  async *run(url, query, questions, options) {
    console.log('DeepCrawler run');
    // const { fetchOptions, limit, stream } = options || {};
    await this.learn(url, query, questions, options);
    console.log(JSON.stringify(this.state, null, 2));

    const stream = this.pq(url, query, questions, 'linksTo', options);

    const seen = {};
    for await (const url of stream) {
      // console.log('linksTo candidate -->', url);
      const targetUrls = await this.findUrls(url, new RegExp(this.state.target.regex));
      // console.log('targetUrls', targetUrls);
      // console.log('targetUrls', targetUrls.length);

      for (const targetUrl of targetUrls) {
        if (seen[targetUrl]) {
          continue;
        }
        seen[targetUrl] = true;
        yield Promise.resolve(targetUrl);
      }
    }
  }

  async findUrls(url, regex) {
    const urls = [];
    for await (const doc of this._fetch(url)) {
      for (const link of doc.links) {
        if (link.url.match(regex)) {
          urls.push(normalize(link.url));
        }
      }
    }
    return urls;
  }

  async *pq(url, query, questions, lookingFor, options) {
    const q = {
      is: [],
      linksTo: [{ url }],
    };

    const seen = {
      is: {},
      linksTo: {},
    };

    const didYield = {};
    const candidates = [];

    const yieldPerIteration = 10;
    for (let i = 0; i < 20; i++) {
      console.log('');
      console.log(`== ${i} ==`);

      // console.log(q.linksTo);

      const linksTo = q.linksTo.pop();
      if (!linksTo) {
        console.log('no more linksTo, break');
        break;
      }

      if (seen.linksTo[linksTo.url]) {
        console.log('seen, skip', linksTo.url);
        continue;
      }
      seen.linksTo[linksTo.url] = true;

      const c = await this.crawlLinksTo(query, linksTo.url);

      q.linksTo.push(...c);
      q.linksTo.sort((a, b) => a.rating.linksTo - b.rating.linksTo);

      candidates.push(...c);
      candidates.sort((a, b) => a.rating[lookingFor] - b.rating[lookingFor]);

      // for (const l of candidates) {
      //   console.log([l.rating.is, l.rating.linksTo, l.url].join('\t'));
      // }

      // Yield some on each iteration and then crawl
      for (let i = 0; i < yieldPerIteration; i++) {
        for (const r of candidates) {
          if (didYield[r.url]) {
            continue
          }
          didYield[r.url] = true;
          yield Promise.resolve(r.url);
        }
      }
    }

    for (const r of candidates) {
      if (didYield[r.url]) {
        continue
      }
      didYield[r.url] = true;
      yield Promise.resolve(r.url);
    }

  }

  async learn(url, query, questions, options) {
    const urls = [];
    const stream = this.pq(url, query, questions, 'linksTo', options);
    for await (const url of stream) {
      console.log('url==>', url);
      urls.push(url);
    }

    console.log('urls', urls);
    const { cats, byCat } = await this.categorize(urls);
    console.log('cats, byCat', cats, byCat);
    const best = await this.pick(byCat, query, questions);
    this.state = {
      target: cats[best],
    };
  }

  async *_fetch(url) {
    const fetchOptions = {}; // TODO
    for await (const doc of this.fetcher.fetch(url, fetchOptions)) {
      yield Promise.resolve(doc);
    }
  }

  async crawlLinksTo(query, url) {
    console.log('\t--> crawl links to', url);

    const limit = 1000; // TODO

    let out = [];
    for await (const doc of this._fetch(url)) {
      const maxBytes = this.ai.maxTokens / 2;
      const chunks = this.linkChunks(doc, maxBytes);
      for (const chunk of chunks) {
        // console.log('chunk', chunk);
        const prompt = rate.render({
          query,
          links: JSON.stringify(chunk, null, 2),
        });
        const stream = this.ai.stream(prompt, { format: 'jsonl', cacheHint: limit });
        for await (const r of stream) {
          if (r.delta.meta) {
            // console.log(r.delta);
            continue;
          }

          const link = decodeLinks(chunk, [r.delta.id]);
          const rating = { ...(r.delta), ...(link[0]) }
          // console.log('rating', rating.id, rating.url);

          out.push({
            url: normalize(rating.url),
            rating: {
              is: rating.isTargetRating,
              linksTo: rating.linksToTargetRating,
            }
          });
        }
      }
    }

    out = out.sort((a, b) => a.is - b.is);
    return out;
  }

  async categorize(urls) {
    const prompt = categorize.render({ urls });

    const stream = this.ai.stream(prompt, { format: 'jsonl' });
    const cats = {}
    for await (const r of stream) {
      const cat = {
        name: r.delta.categoryName,
        pattern: r.delta.urlPattern,
        regex: r.delta.regex,
      };
      cats[cat.name] = cat;
    }

    const byCat = {};
    for (const url of urls) {
      let m = 'no-match';
      for (const cat of Object.values(cats)) {
        if (url.match(new RegExp(cat.regex))) {
          console.log(cat);
          m = cat.name;
          break;
        }
      }
      byCat[m] ||= [];
      byCat[m].push(url);
    }

    return { cats, byCat };
  }

  async pick(byCat, query, questions) {
    const fetchOptions = {}; // TODO

    const scoreUrl = async (url) => {
      console.log('score:', url);
      let doc;
      for await (const d of this._fetch(url)) {
        doc = d;
        break;
      }

      const html = doc.html.substr(0, this.ai.maxTokens * 4 * .75);

      // console.log('@@@@@@@');
      // console.log(html);
      // console.log('@@@@@@@');

      const prompt = score.render({
        html,
        questions: JSON.stringify(questions, null, 2),
      });

      // console.log(prompt);

      const answer = await this.ai.ask(prompt, { format: 'json' });
      // console.log('url', url);
      // console.log('score answer', questions, answer);

      const s = Object.keys(answer.partial)
        .map(key => answer.partial[key] == 'found' ? 1 : 0)
        .reduce((acc, x) => acc + x, 0);
      return s;
    }

    let best = null;

    const n = 5;
    for (const cat of Object.keys(byCat)) {
      const urls = byCat[cat].slice(0, n);
      console.log('score these:', urls);
      const s = (await Promise.all(urls.map(scoreUrl)))
        .reduce((acc, x) => acc + x, 0);
      console.log(cat, s);

      if (!best || s > best.s) {
        best = { name: cat, s };
      }
    }

    return best.name;
  }
}
