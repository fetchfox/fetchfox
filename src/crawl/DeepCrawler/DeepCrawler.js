import { logger } from '../../log/logger.js';
import { BaseCrawler } from '../BaseCrawler.js';
import * as prompts from './prompts.js';

export class DeepCrawler extends BaseCrawler {
  async *run(url, query, options) {
    const fetchOptions = options?.fetchOptions || {};
    const maxDepth = options?.maxDepth ?? 10;

    const scrapeTypePrompt = prompts.scrapeType.render({ prompt: query });
    const scrapeTypeAnswer = await this.ai.ask(scrapeTypePrompt, { format: 'json' });
    const scrapeType = scrapeTypeAnswer.partial.type;
    logger.debug(`${this} Prompt has scrape type: ${scrapeType}`);

    const seen = new Set();
    const urlStack = [url];

    for (let i = 0; i < maxDepth && !options.signal?.aborted; i++) {
      const latestUrl = urlStack[urlStack.length - 1];
      logger.debug(`${this} Processing ${latestUrl}`);

      const doc = await this.fetcher.first(latestUrl, fetchOptions);

      const { prompt: aiPrompt } = await prompts.analyzePage.renderCapped(
        { html: doc.html, prompt: query },
        'html',
        this.ai,
      );
      const answer = await this.ai.ask(aiPrompt, { format: 'json' });
      const pageInfo = answer.partial;

      logger.debug(`${this} Page info: ${JSON.stringify(pageInfo, null, 2)}`);

      switch (pageInfo.pageType) {
        case 'relevant_list_view':
          {
            // We're scraping the data from the listview itself, so just return
            // the page itself
            if (pageInfo.everyFieldIsPresent ||
                !pageInfo.detailViewUrlSelector ||
                !pageInfo.detailViewUrlAttribute)
            {
              yield Promise.resolve({ _url: latestUrl });
              return;
            }

            // Otherwise, we need to grab the detail views
            const docs = await this.fetcher.fetch(latestUrl, fetchOptions);
            for await (const doc of docs) {
              const detailUrls = doc.getLinks(
                pageInfo.detailViewUrlSelector,
                pageInfo.detailViewUrlAttribute);

              for (const it of detailUrls) {
                yield Promise.resolve({ _url: it });
              }
            }
          }
          return;

        case 'relevant_detail_view':
          {
            if (scrapeType == 'fetch_many') {
              if (pageInfo.listViewUrl) {
                const nextUrl = new URL(pageInfo.listViewUrl, url).toString();
                if (!seen.has(nextUrl)) urlStack.push(nextUrl);
                break;
              }
              // If it can't find the list view url, just continue to fetch the
              // current page as a single entry
            }
            yield Promise.resolve({ _url: latestUrl });
          }
          return;

        case 'irrelevant':
          {
            if (!pageInfo.guessUrl) {
              return;
            }

            const nextUrl = new URL(pageInfo.guessUrl, url).toString();
            if (!seen.has(nextUrl)) urlStack.push(nextUrl);
          }
          break;
      }
    }
  }
}
