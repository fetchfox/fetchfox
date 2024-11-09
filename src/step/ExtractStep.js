import { logger } from '../log/logger.js';
import { getExtractor } from '../extract/index.js';
import { BaseStep } from './BaseStep.js';
import { isPlainObject } from '../util.js';

export const ExtractStep = class extends BaseStep {
  constructor(args) {
    super(args);

    if (args?.single) {
      this.single = !!args.single;
      delete args.single;
    }

    let questions;
    if (typeof args == 'string') {
      questions = [args];
    } else if (args.questions) {
      questions = args.questions;
    } else if (isPlainObject(args)) {
      questions = args;
    }

    if (!questions) throw new Error('No questions for extract step');

    this.questions = questions;
  }

  async process({ cursor, item }, cb) {
    logger.debug(`Extract step getting ${JSON.stringify(this.questions)} from ${item}`);
    const start = (new Date()).getTime();
    const ex = cursor.ctx.extractor;

    const stream = ex.stream(
      item,
      this.questions,
      { single: this.single });

    for await (const output of stream) {
      const took = (new Date()).getTime() - start;
      logger.debug(`Extract took ${took/1000} sec so far`);

      const done = cb(output);
      if (done) break;
      if (this.single) break;
    }
  }
}
