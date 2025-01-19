import { logger } from '../log/logger.js';
import { validate } from './util.js';
import { chunkList } from '../util.js';
import { BaseCrawler } from './BaseCrawler.js';
import { gather } from './prompts.js';

export const Crawler = class extends BaseCrawler {
  async *run(url, query, options) {
    this.usage.requests++
    const maxPages = options?.maxPages;
    const fetchOptions = options?.fetchOptions || {};
    const seen = {};

    const gen = this.fetcher.fetch(url, { maxPages, ...fetchOptions });
    for await (const doc of gen) {
      for await (const r of this._processDoc(doc, query, seen, options)) {
        yield Promise.resolve(r);
      }
    }
  }

  async *_processDoc(doc, query, seen, options) {
    doc.parseLinks(options?.css);
    const links = doc.links;
    doc.parseLinks();

    // TODO: move this initailization to a better spot.
    // maybe make getAI() async and put it there.
    await this.ai.init();

    // Cap max bytes to limit number of links examined a a time
    const maxBytes = Math.min(10000, this.ai.maxTokens / 2);

    const slimmer = item => ({
      id: item.id,
      html: item.html.substr(0, 200),
      text: item.text,
      url: item.url,
    });

    const chunked = chunkList(links.map(slimmer), maxBytes);

    for (let i = 0; i < chunked.length; i++) {
      const chunk = chunked[i];
      const prompt = gather.render({
        query,
        links: JSON.stringify(
          chunk.filter(l => validate(l.url)),
          null,
          2),
      });

      const toLink = {};
      for (const link of links) {
        toLink[link.id] = link;
      }

      const stream = this.ai.stream(prompt, { format: 'jsonl' });

      for await (const { delta } of stream) {
        if (!toLink[delta.id]) {
          logger.warn(`${this} Could not find link with id ${delta.id}`);
          continue;
        }

        const link = toLink[delta.id];

        if (seen[link.url]) continue;
        seen[link.url] = true;
        delete link.id;

        logger.info(`Found link ${link.url} in response to "${query}"`);

        this.usage.count++;
        yield Promise.resolve({ _url: link.url });
      }
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
