import { logger } from '../log/logger.js';
import { SinglePromptExtractor } from './SinglePromptExtractor.js';
import { MinimizingExtractor } from './MinimizingExtractor.js';
import { CodeGenExtractor } from './CodeGenExtractor.js';

export { BaseExtractor } from './BaseExtractor.js';
export const DefaultExtractor = SinglePromptExtractor;

export const getExtractor = (which, options) => {
  if (!which) {
    return new MinimizingExtractor({ ...options, extractor: new SinglePromptExtractor(options) });
  }
  if (typeof which != 'string') return which;

  let extractorClass = {
    sp: SinglePromptExtractor,
    'single-prompt': SinglePromptExtractor,

    m: MinimizingExtractor,
    min: MinimizingExtractor,
    minimizing: MinimizingExtractor,

    cg: CodeGenExtractor,
    'code-gen': CodeGenExtractor,
  }[which];

  if (!extractorClass) {
    logger.error(`Unknown extractor type: ${which}`);
    return;
  }

  return new extractorClass(options);
}
