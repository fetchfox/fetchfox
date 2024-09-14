import { BaseExtractor } from './BaseExtractor.js';

export const IterativePromptExtractor = class extends BaseExtractor {
  constructor(ai, options) {
    super(ai, options);
  }

  async *run(target, questions, options) {
    const { stream } = options || {};
  }
}

