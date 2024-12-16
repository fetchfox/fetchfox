import { logger } from '../log/logger.js';
import { Fetcher } from './Fetcher.js';
import { RelayFetcher } from './RelayFetcher.js'
import { PlaywrightFetcher } from './PlaywrightFetcher.js';

export { BaseFetcher } from './BaseFetcher.js';
import { BaseFetcher } from './BaseFetcher.js';

export const DefaultFetcher = Fetcher;

export const getFetcher = (which, options) => {
  if (which instanceof BaseFetcher) {
    return which;
  }

  if (!which) which = 'playwright';
  let fetcherClass = {
    f: Fetcher,
    fetch: Fetcher,

    p: PlaywrightFetcher,
    playwright: PlaywrightFetcher,

    r: RelayFetcher,
    relay: RelayFetcher,
  }[which];
  if (!fetcherClass) {
    logger.error(`Unknown fetcher: ${which}`);
    return;
  }
  return new fetcherClass(options);
}
