import { BaseCrawler } from '../BaseCrawler.js';
import * as prompts from './prompts.js';
import { TagRemovingMinimizer } from '../../min/TagRemovingMinimizer.js';

export class DeepCrawler extends BaseCrawler {
  async *run(url, query, options) {
    const fetchOptions = options?.fetchOptions || {};
    const maxDepth = options?.maxDepth ?? 10;

    const scrapeTypePrompt = prompts.scrapeType.render({ prompt: query });
    const scrapeTypeAnswer = await this.ai.ask(scrapeTypePrompt, { format: 'json' });
    const scrapeType = scrapeTypeAnswer.partial.type;
    console.log(`prompt has scrape type: ${scrapeType}`);

    const seen = new Set();
    const urlStack = [url];

    for (let i = 0; i < maxDepth && !options.signal?.aborted; i++) {
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
          if (pageInfo.everyFieldIsPresent || !pageInfo.detailViewUrlSelector || !pageInfo.detailViewUrlAttribute) {
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
              const nextUrl = new URL(pageInfo.listViewUrl, url).toString();
              if (!seen.has(nextUrl)) urlStack.push(nextUrl);
              break;
            }
            // if it can't find the list view url, just continue to fetch the current page as a single entry
          }
          yield Promise.resolve({ _url: latestUrl });
          return;

        case 'unknown':
          if (!pageInfo.guessUrl) return;

          const nextUrl = new URL(pageInfo.guessUrl, url).toString();
          if (!seen.has(nextUrl)) urlStack.push(nextUrl);
          break;
      }
    }
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
