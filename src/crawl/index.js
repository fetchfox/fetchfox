import { Crawler } from './Crawler.js';

export { BaseCrawler } from './BaseCrawler.js';

export const getCrawler = (unused, options) => {
  return new Crawler(options);
}
