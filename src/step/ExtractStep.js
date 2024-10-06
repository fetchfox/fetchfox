import { logger } from '../log/logger.js';
import { getExtractor } from '../index.js';
import { BaseStep } from './BaseStep.js';

export const ExtractStep = class extends BaseStep {
  constructor(args) {
    super(args);

    let extractor;
    let questions;
    if (typeof args == 'string') {
      questions = [args];
    } else if (Array.isArray(args)) {
      questions = args;
    } else {
      extractor = args.extractor;
      questions = args.questions;
    }

    if (!extractor) extractor = getExtractor();
    if (!questions) throw new Error('No questions for extract step');

    this.extractor = extractor;
    this.questions = questions;

    this.single = args?.single;
  }

  async *run(cursor) {
    logger.info(`Extract for ${this.questions.join(', ')}`);

    for (const target of cursor.last) {
      logger.info(`Extract from ${target}`);
      for await (const item of this.extractor.stream(target, this.questions, options)) {
        yield Promise.resolve(item);
        if (this.single) break;
      }
    }
  }
}
