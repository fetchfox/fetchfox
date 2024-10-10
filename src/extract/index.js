import { logger } from '../log/logger.js';
import { SinglePromptExtractor } from './SinglePromptExtractor.js';
import { IterativePromptExtractor } from './IterativePromptExtractor.js';
import { MinimizingExtractor } from './MinimizingExtractor.js';

export const DefaultExtractor = SinglePromptExtractor;

export const getExtractor = (which, options) => {
  if (!which) return new DefaultExtractor(options);
  if (typeof which != 'string') return which;

  let extractorClass = {
    sp: SinglePromptExtractor,
    'single-prompt': SinglePromptExtractor,

    ip: IterativePromptExtractor,
    'iterative-prompt': IterativePromptExtractor,

    m: MinimizingExtractor,
    min: MinimizingExtractor,
    minimizing: MinimizingExtractor,
  }[which];

  if (!extractorClass) {
    logger.error(`Unknown extractor type: ${which}`);
    return;
  }

  return new extractorClass(options);
}
