import { ExtractusMinimizer } from './ExtractusMinimizer.js';
import { AiMinimizer } from './AiMinimizer.js';

export const DefaultMinimizer = ExtractusMinimizer;

export const getMinimizer = (which, options) => {
  console.log('get mini', which, options);

  if (!which) return new DefaultMinimizer(options);
  if (typeof which != 'string') return which;

  let minimizerClass = {
    e: ExtractusMinimizer,
    extractus: ExtractusMinimizer,

    ai: AiMinimizer,
  }[which];
  if (!minimizerClass) {
    console.error(`Unknown minimizer type: ${which}`);
    return;
  }
  return new minimizerClass(options);
}
