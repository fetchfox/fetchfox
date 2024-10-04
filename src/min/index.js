import { logger } from '../log/logger.js';
import { TextOnlyMinimizer } from './TextOnlyMinimizer.js';
import { TagRemovingMinimizer } from './TagRemovingMinimizer.js';
import { ExtractusMinimizer } from './ExtractusMinimizer.js';

export const DefaultMinimizer = TagRemovingMinimizer;

export const getMinimizer = (which, options) => {
  if (!which) return new DefaultMinimizer(options);
  if (typeof which != 'string') return which;

  let minimizerClass = {
    tr: TagRemovingMinimizer,
    'tag-removing': TagRemovingMinimizer,

    to: TextOnlyMinimizer,
    'text-only': TextOnlyMinimizer,

    e: ExtractusMinimizer,
    extractus: ExtractusMinimizer,
  }[which];
  if (!minimizerClass) {
    logger.error(`Unknown minimizer type: ${which}`);
    return;
  }
  return new minimizerClass(options);
}
