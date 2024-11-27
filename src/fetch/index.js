import { logger } from '../log/logger.js';
import { Fetcher } from './Fetcher.js';
import { RelayFetcher } from './RelayFetcher.js'
import { PlaywrightFetcher } from './PlaywrightFetcher.js';
import { BritishAirwaysFetcher } from './BritishAirwaysFetcher.js';

export { BaseFetcher } from './BaseFetcher.js';
import { BaseFetcher } from './BaseFetcher.js';

export const DefaultFetcher = Fetcher;

export const getFetcher = (which, options) => {

  logger.trace(`getFetcher ${which}`);

  if (which instanceof BaseFetcher) {
    return which;
  }

  if (!which) which = 'fetch';
  let fetcherClass = {
    f: Fetcher,
    fetch: Fetcher,

    p: PlaywrightFetcher,
    playwright: PlaywrightFetcher,

    r: RelayFetcher,
    relay: RelayFetcher,

    ba: BritishAirwaysFetcher,
  }[which];
  if (!fetcherClass) {
    logger.error(`Unknown fetcher: ${which}`);
    return;
  }
  return new fetcherClass(options);
}
