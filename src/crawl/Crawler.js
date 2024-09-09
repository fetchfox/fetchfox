import { logger } from '../log/logger.js';
import { gather } from './prompts.js';

export const Crawler = class {
  constructor(fetcher, ai) {
    this.fetcher = fetcher;
    this.ai = ai;
  }

  async crawl(url, question, cb, options) {
    const { fetchOptions } = options || {};
    logger.info(`Crawling ${url} with for "${question}"`);

    const doc = await this.fetcher.fetch(url, fetchOptions);

    const links = shuffle(dedupeLinks(doc.links));
    const limit = 6000;
    const slimmer = item => ({
      id: item.id,
      html: item.html.substr(0, 200),
      text: item.text,
      url: item.url,
    });

    const chunked = chunkList(links.map(slimmer), limit);

    let matches = [];
    for (let i = 0; i < chunked.length; i++) {
      const chunk = chunked[i];
      const prompt = gather.render({
        question,
        links: JSON.stringify(chunk, null, 2),
      });
      const { answer } = await this.ai.ask(prompt);

      const partial = []
      for (const m of answer) {
        for (const link of doc.links) {
          if (link.id == m.id) partial.push(link);
        }
      }
      matches = dedupeLinks(matches.concat(cleanLinks(partial)));
      if (cb) cb({
        delta: partial,
        partial: matches,
        progress: i / chunked.length,
      });
    }

    logger.info(`Found ${matches.length} matches in ${links.length} links"`);

    return matches;
  }
}

const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
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
