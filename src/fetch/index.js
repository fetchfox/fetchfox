import { logger } from '../log/logger.js';
import { Fetcher } from './Fetcher.js';
import { PlaywrightFetcher } from './PlaywrightFetcher.js';

export { BaseFetcher } from './BaseFetcher.js';
export { FetchInstructions } from './FetchInstructions.js';
export { PlaywrightFetcher } from './PlaywrightFetcher.js';
export { Fetcher } from './Fetcher.js';

import { BaseFetcher } from './BaseFetcher.js';

export const DefaultFetcher = Fetcher;

const classes = {
  f: Fetcher,
  fetch: Fetcher,

  p: PlaywrightFetcher,
  playwright: PlaywrightFetcher,
};

export const registerFetcher = (tag, cls) => {
  classes[tag] = cls;
}

export const getFetcher = (which, options) => {
  if (which instanceof BaseFetcher) {
    return which;
  }
  if (!which) {
    which = 'fetch';
  }

  let fetcherClass = classes[which];
  if (!fetcherClass) {
    logger.error(`Unknown fetcher: ${which}`);
    return;
  }
  return new fetcherClass(options);
}
