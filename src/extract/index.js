import { logger } from '../log/logger.js';
import { DirectExtractor } from './DirectExtractor.js';
import { AuthorExtractor } from './AuthorExtractor.js';

export { BaseExtractor } from './BaseExtractor.js';
export { DirectExtractor } from './DirectExtractor.js';
export { AuthorExtractor } from './AuthorExtractor.js';

export const DefaultExtractor = DirectExtractor;

export const getExtractor = (which, options) => {
  if (!which) {
    return new DirectExtractor(options);
  }
  if (typeof which != 'string') return which;

  let extractorClass = {
    'direct': DirectExtractor,
    'author': AuthorExtractor,
  }[which];

  if (!extractorClass) {
    logger.error(`Unknown extractor type: ${which}`);
    return;
  }

  return new extractorClass(options);
}
