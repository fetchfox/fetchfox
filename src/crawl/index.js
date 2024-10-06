import { Crawler } from './Crawler.js';

export const getCrawler = (unused, options) => {
  return new Crawler(options);
}
