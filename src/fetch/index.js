import { logger } from '../log/logger.js';
import { Fetcher } from '../fetch/Fetcher.js';
import { PuppeteerFetcher } from '../fetch/PuppeteerFetcher.js';

export { Fetcher as DefaultFetcher } from './Fetcher.js';

export const getFetcher = (name, options) => {
  let fetcherClass = {
    fetch: Fetcher,
    puppeteer: PuppeteerFetcher,
  }[name];
  if (!fetcherClass) {
    console.error(`Unknown fetcher: ${name}`);
    return;
  }
  return new fetcherClass(options);
}
