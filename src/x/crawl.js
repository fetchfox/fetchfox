import { range, last } from 'radash';
import { shuffle as stableShuffle } from '../util.js';
import { getFetcher, getAI, DiskCache } from '../index.js';
import { Crawler } from '../crawl/Crawler.js';
import { SinglePromptExtractor } from '../extract/SinglePromptExtractor.js';
import { TagRemovingMinimizer } from '../min/TagRemovingMinimizer.js';
import * as prompts from './prompts.js';

let cache = new DiskCache('/tmp/ff-cache', { ttls: { base: 1e100 } });
// cache = null;

export class Crawler2 {
  constructor(options) {
    this.fetcher = options?.fetcher || getFetcher(null, { cache });
    this.ai = options?.ai || getAI(null, { cache });
  }

  async crawl({ url, prompt, kb }) {
    const pq = {
      items: [],
      links: [],
    };
    await this.step({ url, prompt, kb, pq });
    console.log(pq);
  }

  async step({ url, prompt, kb, pq }) {
    const doc = await this.fetcher.first(url);
    const minDoc = await (new TagRemovingMinimizer({ cache })).min(doc);
    const links = minDoc.links.map((link) => ({
      url: link.url.substring(0, 200),
      text: link.text.substring(0, 200),
      html: link.html.substring(0, 200),
    }));
    const subset = stableShuffle(links).slice(0, 100);
    const context = {
      url,
      text: minDoc.text,
      links: JSON.stringify(subset, null, 2),
      prompt,
      kb: JSON.stringify(kb, null, 2),
    };
    const { prompt: crawlPrompt } = await prompts
      .crawl
      .renderCapped(context, 'text', this.ai);
    console.log('crawlPrompt', crawlPrompt);
    const stream = this.ai.stream(crawlPrompt, { format: 'jsonl' });


    for await (const { delta } of stream) {
      console.log('delta ->', delta);

      pq.items.push({
        url: delta.url,
        rating: delta.ratingHasItem,
      });
      pq.links.push({
        url: delta.url,
        rating: delta.ratingHasLinks,
      });
    }

    pq.items.sort((a, b) => b.rating - a.rating);
    pq.links.sort((a, b) => b.rating - a.rating);
  }
}
