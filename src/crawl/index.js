// import { Crawler } from "./Crawler.js";
import { DeepCrawler } from './DeepCrawler.js';
export { BaseCrawler } from './BaseCrawler.js';

// is this where the default crawler is set?
export const getCrawler = (unused, options) => {
  // return new Crawler(options);
  return new DeepCrawler(options);
};
