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

  async stop() {
    console.log('MIN EX GOT STOP');
    this.extractor.stop();
  }

  async *run(target, questions, options) {
    const { stream } = options || {};

    const doc = await this.getDoc(target);
    if (this.stopped) return;

    const chunks = this.chunks(doc);

    const min = await this.minimizer.min(doc);
    if (this.stopped) return;

    for await (const result of this.extractor.run(min, questions, options)) {
      if (this.stopped) break;
      yield Promise.resolve(result);
    }
  }
}
