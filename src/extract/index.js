import { BasicExtractor } from './BasicExtractor.js';
import { IterativePromptExtractor } from './IterativePromptExtractor.js';
import { MinimizingExtractor } from './MinimizingExtractor.js';

export const DefaultExtractor = IterativePromptExtractor;

export const getExtractor = (which, options) => {
  if (!which) return new DefaultExtractor(options);
  if (typeof which != 'string') return which;

  let extractorClass = {
    b: BasicExtractor,
    basic: BasicExtractor,

    ip: IterativePromptExtractor,
    'iterative-prompt': IterativePromptExtractor,

    m: MinimizingExtractor,
    min: MinimizingExtractor,
    minimizing: MinimizingExtractor,
  }[which];
  if (!extractorClass) {
    console.error(`Unknown extractor type: ${which}`);
    return;
  }

  return new extractorClass(options);
}
