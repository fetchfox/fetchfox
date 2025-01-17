import * as cheerio from 'cheerio';

import { BaseCrawler } from '../BaseCrawler.js';
import { SCRAPE_PAGE_PROMPT, SCRAPE_TYPE_PROMPT, ANALYZE_PAGE_PROMPT, GENERATE_SCHEMA_PROMPT } from './prompts.js';

export class DeepCrawler extends BaseCrawler {
  // TODO(pilvcc): what is `query` and what do we do with it?
  async *run(url, query, options) {
    const fetchOptions = options?.fetchOptions || {};

    const userPrompt = options.originalPrompt;

    const scrapeType = await getPromptScrapeType(userPrompt);
    console.log(`prompt has scrape type: ${scrapeType}`);

    const schema = await generateSchemaFromPrompt(userPrompt);
    console.log('schema generated', JSON.stringify(schema, null, 2));

    const seenUrls = new Set();
    const urlStack = [url];

    while (true) {
      const latestUrl = urlStack[urlStack.length - 1];
      console.log('processing', latestUrl);

      // we've seen this url, we're just going in circles now
      if (seenUrls.has(latestUrl)) return null;

      seenUrls.add(latestUrl);

      const { html } = await this.fetcher.first(latestUrl, fetchOptions);

      const pageInfo = await analyzePage(html, userPrompt);
      console.log(JSON.stringify(pageInfo, null, 2));

      switch (pageInfo.pageType) {
        case 'list_view':
          // now that we're at a list view, use fetcher to do pagination & grab all pages
          const paginatedDocs = await this.fetcher.fetch(latestUrl, fetchOptions);

          // we're scraping the data from the listview itself, so just return the paginated pages themselves
          if (pageInfo.hasAllFields || !pageInfo.detailViewUrlSelector || !pageInfo.detailViewUrlAttribute) {
            for (const doc of paginatedDocs) {
              yield Promise.resolve({ _url: doc.url });
            }
            return;
          }

          // otherwise, we need to grab the detail views

          for (const doc of paginatedDocs) {
            const $ = cheerio.load(doc.html);
            const detailUrls = [];

            $(pageInfo.detailViewUrlSelector).each((_, elem) => {
              detailUrls.push(this.normalizeUrl($(elem).attr(pageInfo.detailViewUrlAttribute), url));
            });

            for (const it of detailUrls) {
              yield Promise.resolve({ _url: it });
            }
          }

          return;

        case 'detail_view':
          if (scrapeType === 'fetch_many') {
            if (pageInfo.listViewUrl) {
              urlStack.push(this.normalizeUrl(pageInfo.listViewUrl, url));
              break;
            }
            // if it can't find the list view url, just continue to fetch the current page as a single entry
          }
          yield Promise.resolve({ _url: latestUrl });
          return;

        case 'unknown':
          if (!pageInfo.guessUrl) return null;

          urlStack.push(this.normalizeUrl(pageInfo.guessUrl, url));
          break;
      }
    }
  }

  normalizeUrl(url, originalUrl) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const origin = new URL(originalUrl).origin;
    if (url.startsWith('//')) {
      url = url.slice(1);
    }
    return new URL(url, origin).toString();
  }

  async analyzePage(html, userPrompt) {
    let rawPrompt = ANALYZE_PAGE_PROMPT;
    rawPrompt = rawPrompt.replace('{{html}}', html);
    rawPrompt = rawPrompt.replace('{{prompt}}', userPrompt);

    const { answer, truncatedPrompt } = await this.ai.ask(rawPrompt, {
      format: 'json',
    });

    writeFileSync('logs/analyze-page-prompt.txt', truncatedPrompt);

    return tryParseJson(answer);
  }

  async scrapePage(scrapeType, schema, html) {
    let rawPrompt = SCRAPE_PAGE_PROMPT;
    rawPrompt = rawPrompt.replace('{{scrapeType}}', scrapeType);
    rawPrompt = rawPrompt.replace('{{schema}}', JSON.stringify(schema));
    rawPrompt = rawPrompt.replace('{{html}}', html);

    const { answer } = await this.ai.ask(rawPrompt, { format: 'json' });
    try {
      return tryParseJson(answer);
    } catch (err) {
      console.log('invalid response', answer);
      throw err;
    }
  }

  async getPromptScrapeType(prompt) {
    const rawPrompt = SCRAPE_TYPE_PROMPT.replace('{{prompt}}', prompt);
    const { answer } = await this.ai.ask(rawPrompt, { format: 'json' });
    const parsed = tryParseJson(answer);
    return parsed.type;
  }

  async generateSchemaFromPrompt(prompt) {
    const rawPrompt = GENERATE_SCHEMA_PROMPT.replace('{{prompt}}', prompt);
    const { answer } = await this.ai.ask(rawPrompt, { format: 'json' });
    return tryParseJson(answer);
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
