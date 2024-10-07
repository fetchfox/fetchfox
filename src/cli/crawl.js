import { logger } from '../log/logger.js';
import { Crawler } from '../crawl/Crawler.js';
import { getAI } from '../ai/index.js';
import { getFetcher } from '../fetch/index.js';

export const crawl = async (url, prompt, options) => {
  const ai = getAI(options.ai, options.apiKey);
  const fetcher = getFetcher(options.fetcher);
  const crawler = new Crawler(ai, fetcher);

  for await (const { link } of crawler.stream(url, prompt)) {
    console.log(link.url);
  }
}
