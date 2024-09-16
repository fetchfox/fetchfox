import { BasicExtractor } from './BasicExtractor.js';
import { IterativePromptExtractor } from './IterativePromptExtractor.js';
import { CodeGenExtractor } from './CodeGenExtractor.js';

export { IterativePromptExtractor as DefaultExtractor };

export const getExtractor = (which, options) => {
  if (typeof which != 'string') {
    return which;
  }

  let extractorClass = {
    b: BasicExtractor,
    basic: BasicExtractor,

    ip: IterativePromptExtractor,
    'iterative-prompt': IterativePromptExtractor,

    cg: CodeGenExtractor,
    'code-gen': CodeGenExtractor,
  }[which];
  if (!extractorClass) {
    console.error(`Unknown extractor type: ${which}`);
    return;
  }
  return new extractorClass(options);
}
