import { logger } from '../log/logger.js';
import { shuffle, chunkList } from '../util.js';
import { BaseCrawler } from './BaseCrawler.js';
import { gather } from './prompts.js';

export const Crawler = class extends BaseCrawler {
  async *run(url, query, options) {
    const { fetchOptions, limit, stream } = options || {};

    logger.info(`Crawling ${url} with for "${query}"`);

    const doc = await this.fetcher.fetch(url, fetchOptions);
    const links = doc.links;
    const maxBytes = this.ai.maxTokens / 2;
    const slimmer = item => ({
      id: item.id,
      html: item.html.substr(0, 200),
      text: item.text,
      url: item.url,
    });

    const chunked = chunkList(links.map(slimmer), maxBytes);

    let matches = [];
    let count = 0;

    for (let i = 0; i < chunked.length; i++) {
      const chunk = chunked[i];
      const prompt = gather.render({
        query,
        links: JSON.stringify(
          chunk.filter(l => validate(l.url)),
          null,
          2),
      });

      const seen = {};
      const toLink = {};
      for (const link of doc.links) {
        toLink[link.id] = link;
      }

      const stream = this.ai.stream(prompt, { format: 'jsonl', cacheHint: limit });
      for await (const { delta, usage } of stream) {
        if (!toLink[delta.id]) {
          logger.warn(`Could not find link with id ${delta.id}`);
          continue;
        }

        const link = toLink[delta.id];

        if (seen[link.url]) continue;
        seen[link.url] = true;
        delete link.id;

        logger.info(`Found link ${link.url} in response to "${query}"`);

        if (count++ >= limit) break;
        yield Promise.resolve(link);
      }

      if (limit && count >= limit) return;
    }
  }

  async all(url, query, options) {
    options = {...options, stream: false };
    let result = [];
    for await (const r of this.run(url, query, options)) {
      result.push(r);
    }
    return result;
  }

  async one(url, query, options) {
    options = {...options, stream: true };
    for await (const r of this.run(url, query, options)) {
      return r;
    }
  }

  async *stream(url, query, options) {
    options = {...options, stream: true };
    for await (const r of this.run(url, query, options)) {
      yield Promise.resolve(r);
    }
  }
}

const dedupeLinks = (l) => {
  const u = [];
  const seen = {};    
  for (let item of cleanLinks(l)) {
    if (seen[item.url]) continue;
    seen[item.url] = true;
    u.push(item);
  }
  return u;
}

const cleanLinks = (l) => {
  const clean = [];
  const seen = {};    
  for (let item of l) {
    if (!item.url) {
      continue;
    }

    // De-dupe anchors for now. May want to revisit this later.
    item.url = item.url.split('#')[0];
    clean.push(item);
  }
  return clean;
}

export const validate = (url) => {
  return url.indexOf('javascript:') != 0;
}
