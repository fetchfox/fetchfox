import { logger } from '../log/logger.js';
import { Item } from '../item/Item.js';
import { getMinimizer } from '../min/index.js';
import { BaseExtractor } from './BaseExtractor.js';
import { getExtractor } from './index.js';

export const MinimizingExtractor = class extends BaseExtractor {
  constructor(options) {
    super(options);
    this.extractor = getExtractor(options.extractor, options);
    this.ai = this.extractor.ai;
    this.minimizer = getMinimizer(options.minimizer, options);
  }

  async *run(target, questions, options) {
    for await (const doc of this.getDoc(target, questions)) {
      const chunks = this.chunks(doc);
      const min = await this.minimizer.min(doc);
      for await (const result of this.extractor.run(min, questions, options)) {
        yield Promise.resolve(result);
      }
    }
  }
}
