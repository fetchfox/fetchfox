import { logger } from '../log/logger.js';
import { Crawler } from '../crawl/Crawler.js';
import { getAi, getFetcher } from './util.js';

export const crawl = async (url, prompt, options) => {
  const ai = getAi(options.ai, options.apiKey);
  const fetcher = getFetcher(options.fetcher);
  const crawler = new Crawler(fetcher, ai);
  const links = await crawler.crawl(
    url,
    prompt,
    ({ delta, partial, progress }) => {
      logger.info(`Crawl ${Math.round(progress * 100)}% complete`);
      for (const link of delta) {
        console.log(link.url);
      }
    });
}
