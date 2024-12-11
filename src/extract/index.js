import { logger } from '../log/logger.js';
import { SinglePromptExtractor } from './SinglePromptExtractor.js';
import { CodeGenExtractor } from './CodeGenExtractor.js';

export { BaseExtractor } from './BaseExtractor.js';
export const DefaultExtractor = SinglePromptExtractor;

export const getExtractor = (which, options) => {
  if (!which) {
    return new SinglePromptExtractor(options);
  }
  if (typeof which != 'string') return which;

  let extractorClass = {
    sp: SinglePromptExtractor,
    'single-prompt': SinglePromptExtractor,

    cg: CodeGenExtractor,
    'code-gen': CodeGenExtractor,
  }[which];

  if (!extractorClass) {
    logger.error(`Unknown extractor type: ${which}`);
    return;
  }

  return new extractorClass(options);
}
