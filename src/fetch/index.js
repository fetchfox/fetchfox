import { logger } from '../log/logger.js';
import { Fetcher } from './Fetcher.js';
import { PlaywrightFetcher } from './PlaywrightFetcher.js';

export { BaseFetcher } from './BaseFetcher.js';
import { BaseFetcher } from './BaseFetcher.js';

export const DefaultFetcher = Fetcher;

export const getFetcher = (which, options) => {
  if (which instanceof BaseFetcher) {
    return which;
  }

  if (!which) {
    which = 'fetch';
  }

  let fetcherClass = {
    f: Fetcher,
    fetch: Fetcher,

    p: PlaywrightFetcher,
    playwright: PlaywrightFetcher,
  }[which];
  if (!fetcherClass) {
    logger.error(`Unknown fetcher: ${which}`);
    return;
  }
  return new fetcherClass(options);
};
