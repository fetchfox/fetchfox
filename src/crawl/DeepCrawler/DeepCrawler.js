import { parse } from 'node-html-parser';

import { BaseCrawler } from '../BaseCrawler.js';
import * as prompts from './prompts.js';

export class DeepCrawler extends BaseCrawler {
  // TODO(pilvcc): what is `query` and what do we do with it?
  async *run(url, query, options) {
    const fetchOptions = options?.fetchOptions || {};
    const maxDepth = options?.maxDepth ?? 10;

    const promises = [getPromptScrapeType(query), generateSchemaFromPrompt(query)];
    const [scrapeType, schema] = await Promise.all(promises);

    console.log(`prompt has scrape type: ${scrapeType}`);
    console.log('schema generated', JSON.stringify(schema, null, 2));

    const seen = new Set();
    const urlStack = [url];

    for (let i = 0; i < maxDepth; i++) {
      const latestUrl = urlStack[urlStack.length - 1];
      console.log('processing', latestUrl);

      seen.add(latestUrl);

      const doc = await this.fetcher.first(latestUrl, fetchOptions);
      const pageInfo = await analyzePage(doc.html, query);

      console.log(JSON.stringify(pageInfo, null, 2));

      switch (pageInfo.pageType) {
        case 'list_view':
          // we're scraping the data from the listview itself, so just return the page itself
          if (pageInfo.hasAllFields || !pageInfo.detailViewUrlSelector || !pageInfo.detailViewUrlAttribute) {
            yield Promise.resolve({ _url: latestUrl });
            return;
          }

          // otherwise, we need to grab the detail views

          // paginate the current page
          const paginatedDocs = await this.fetcher.fetch(latestUrl, fetchOptions);

          for (const doc of paginatedDocs) {
            const detailUrls = [];

            const root = parse(doc.html);
            const elems = root.querySelectorAll(pageInfo.detailViewUrlSelector);
            for (const elem of elems) {
              const relativeUrl = elem.getAttribute(pageInfo.detailViewUrlAttribute);
              detailUrls.push(this.normalizeUrl(relativeUrl, url));
            }

            for (const it of detailUrls) {
              yield Promise.resolve({ _url: it });
            }
          }

          return;

        case 'detail_view':
          if (scrapeType === 'fetch_many') {
            if (pageInfo.listViewUrl) {
              const newUrl = this.normalizeUrl(pageInfo.listViewUrl, url);
              if (!seen.has(newUrl)) urlStack.push(newUrl);
              break;
            }
            // if it can't find the list view url, just continue to fetch the current page as a single entry
          }
          yield Promise.resolve({ _url: latestUrl });
          return;

        case 'unknown':
          if (!pageInfo.guessUrl) return;

          const newUrl = this.normalizeUrl(pageInfo.guessUrl, url);
          if (!seen.has(newUrl)) urlStack.push(newUrl);
          break;
      }
    }
  }

  normalizeUrl(url, originalUrl) {
    const origin = new URL(originalUrl).origin;
    return new URL(url, origin).toString();
  }

  async analyzePage(html, prompt) {
    const aiPrompt = prompts.analyzePage.render({ html, prompt });
    const answer = await this.ai.ask(aiPrompt, { format: 'json' });
    return answer.partial;
  }

  async getPromptScrapeType(prompt) {
    const aiPrompt = prompts.scrapeType.render({ prompt });
    const answer = await this.ai.ask(aiPrompt, { format: 'json' });
    return answer.partial.type;
  }

  async generateSchemaFromPrompt(prompt) {
    const aiPrompt = prompts.generateSchema.render({ prompt });
    const answer = await this.ai.ask(aiPrompt, { format: 'json' });
    return answer.partial;
  }

  async all(url, query, options) {
    options = { ...options, stream: false };
    let result = [];
    for await (const r of this.run(url, query, options)) {
      result.push(r);
    }
    return result;
  }

  async one(url, query, options) {
    options = { ...options, stream: true };
    for await (const r of this.run(url, query, options)) {
      return r;
    }
  }

  async *stream(url, query, options) {
    options = { ...options, stream: true };
    for await (const r of this.run(url, query, options)) {
      yield Promise.resolve(r);
    }
  }
}
