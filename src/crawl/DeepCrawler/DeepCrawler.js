import { BaseCrawler } from '../BaseCrawler.js';
import * as prompts from './prompts.js';
import { TagRemovingMinimizer } from '../../min/TagRemovingMinimizer.js';

export class DeepCrawler extends BaseCrawler {
  // TODO(pilvcc): what is `query` and what do we do with it?
  async *run(url, query, options) {
    const fetchOptions = options?.fetchOptions || {};
    const maxDepth = options?.maxDepth ?? 10;

    const scrapeTypePrompt = prompts.scrapeType.render({ prompt: query });
    const generateSchemaPrompt = prompts.generateSchema.render({ prompt: query });

    const [scrapeType, schema] = await Promise.all([
      this.ai.ask(scrapeTypePrompt, { format: 'json' }).then((answer) => answer.partial.type),
      this.ai.ask(generateSchemaPrompt, { format: 'json' }).then((answer) => answer.partial),
    ]);

    console.log(`prompt has scrape type: ${scrapeType}`);
    console.log('schema generated', JSON.stringify(schema, null, 2));

    const seen = new Set();
    const urlStack = [url];

    for (let i = 0; i < maxDepth; i++) {
      const latestUrl = urlStack[urlStack.length - 1];
      console.log('processing', latestUrl);

      seen.add(latestUrl);

      const _doc = await this.fetcher.first(latestUrl, fetchOptions);

      const doc = await new TagRemovingMinimizer().min(_doc);

      const { prompt: aiPrompt } = await prompts.analyzePage.renderCapped(
        { html: doc.html, prompt: query },
        'html',
        this.ai,
      );

      const answer = await this.ai.ask(aiPrompt, { format: 'json' });
      const pageInfo = answer.partial;

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

          for await (const doc of paginatedDocs) {
            const detailUrls = doc.getLinks(pageInfo.detailViewUrlSelector, pageInfo.detailViewUrlAttribute);
            for (const it of detailUrls) {
              yield Promise.resolve({ _url: it });
            }
          }

          return;

        case 'detail_view':
          if (scrapeType === 'fetch_many') {
            if (pageInfo.listViewUrl) {
              const nextUrl = this.normalizeUrl(pageInfo.listViewUrl, url);
              if (!seen.has(nextUrl)) urlStack.push(nextUrl);
              break;
            }
            // if it can't find the list view url, just continue to fetch the current page as a single entry
          }
          yield Promise.resolve({ _url: latestUrl });
          return;

        case 'unknown':
          if (!pageInfo.guessUrl) return;

          const nextUrl = this.normalizeUrl(pageInfo.guessUrl, url);
          if (!seen.has(nextUrl)) urlStack.push(nextUrl);
          break;
      }
    }
  }

  normalizeUrl(url, originalUrl) {
    const origin = new URL(originalUrl).origin;
    return new URL(url, origin).toString();
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
