import { logger } from '../log/logger.js';
import { Item } from '../item/Item.js';
import { ExtractusMinimizer } from '../min/ExtractusMinimizer.js';
import { BaseExtractor } from './BaseExtractor.js';
import { getExtractor } from './index.js';
import { single } from './prompts.js';

export const MinimizingExtractor = class extends BaseExtractor {
  constructor(options) {
    super(options);
    this.extractor = getExtractor(options.extractor, options);
    this.min = new ExtractusMinimizer();
  }

  async *run(target, questions, options) {
    const { stream } = options || {};

    const doc = await this.getDoc(target);
    const chunks = this.chunks(doc);

    console.log('run MinimizingExtractor', this.extractor);

    const min = await this.min.min(doc);
    for await (const result of this.extractor.run(min, questions, options)) {
      yield Promise.resolve(result);
    }
  }
}
