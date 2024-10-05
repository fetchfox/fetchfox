import { Crawler } from './Crawler.js';

export const getCrawler = (options) => {
  return new Crawler(options);
}
