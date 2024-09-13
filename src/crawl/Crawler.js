import crypto from 'crypto';
import { logger } from '../log/logger.js';
import { gather } from './prompts.js';
import { DefaultFetcher } from '../fetch/index.js';
import { getAi } from '../ai/index.js';

export const Crawler = class {
  constructor(ai, { fetcher, cache }) {
    this.ai = getAi(ai, { cache });
    this.fetcher = fetcher || new DefaultFetcher({ cache });
  }

  async *run(url, question, options) {
    const { fetchOptions, limit, stream } = options || {};

    logger.info(`Crawling ${url} with for "${question}"`);

    const doc = await this.fetcher.fetch(url, fetchOptions);

    const links = shuffle(dedupeLinks(doc.links));
    const maxBytes = 6000;
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
        question,
        limit: limit || '(No limit)',
        links: JSON.stringify(chunk, null, 2),
      });

      const seen = {};
      const toLink = {};
      for (const link of doc.links) {
        toLink[link.id] = link;
      }

      let gen = this.ai.gen(prompt, { format: 'jsonl', cacheHint: limit, stream });
      for await (const { delta, usage } of gen) {
        if (!toLink[delta.id]) continue;

        const link = toLink[delta.id];
        if (seen[link.url]) continue;

        logger.info(`Found link ${link.url} in response to "${question}"`);

        if (count++ >= limit) break;

        yield Promise.resolve({
          link,
          usage,
          progress: { done: i, total: chunked.length },
        });
      }

      if (limit && count >= limit) return;
    }
  }

  async all(url, question, options) {
    options = {...options, stream: false };
    let result = [];
    for await (const r of this.run(url, question, options)) {
      result.push(r);
    }
    return result;
  }

  async one(url, question, options) {
    options = {...options, stream: true };
    for await (const r of this.run(url, question, options)) {
      return r;
    }
  }

  async *stream(url, question, options) {
    options = {...options, stream: true };
    for await (const r of this.run(url, question, options)) {
      yield Promise.resolve(r);
    }
  }
}

const shuffle = (l) => {
  // Deterministic shuffle to keep prompts stable
  const h = (v) => crypto
    .createHash('sha256')
    .update(JSON.stringify(v))
    .digest('hex');
  l.sort((a, b) => h(a).localeCompare(h(b)));
  return l;
}

const chunkList = (list, maxBytes) => {
  const chunks = [];
  let current = [];
  for (let item of list) {
    current.push(item);
    if (JSON.stringify(current, null, 2).length > maxBytes) {
      chunks.push(current);
      current = [];
    }
  }
  if (current.length) {
    chunks.push(current);
  }
  return chunks;
};

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
