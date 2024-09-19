import { SimpleMinimizer } from './SimpleMinimizer.js';
import { ExtractusMinimizer } from './ExtractusMinimizer.js';
import { AiMinimizer } from './AiMinimizer.js';

export const DefaultMinimizer = SimpleMinimizer;

export const getMinimizer = (which, options) => {
  if (!which) return new DefaultMinimizer(options);
  if (typeof which != 'string') return which;

  let minimizerClass = {
    s: SimpleMinimizer,
    simple: SimpleMinimizer,

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
