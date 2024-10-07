import { logger } from '../log/logger.js';
import { Fetcher } from '../fetch/Fetcher.js';
import { PuppeteerFetcher } from '../fetch/PuppeteerFetcher.js';

export const DefaultFetcher = Fetcher;

export const getFetcher = (which, options) => {
  if (!which) return new DefaultFetcher(options);
  let fetcherClass = {
    fetch: Fetcher,
    puppeteer: PuppeteerFetcher,
  }[which];
  if (!fetcherClass) {
    logger.error(`Unknown fetcher: ${which}`);
    return;
  }
  return new fetcherClass(options);
}
