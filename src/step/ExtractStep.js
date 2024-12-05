import { logger } from '../log/logger.js';
import { getExtractor } from '../extract/index.js';
import { CodeGenExtractor } from '../extract/CodeGenExtractor.js';
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

    if (args?.examples) this.examples = args.examples;
  }

  async before(cursor) {
    const ex = cursor.ctx.extractor;
    if (ex instanceof CodeGenExtractor) {
      logger.info(`Code gen init`);

      await ex.load(this.examples, this.questions);

      if (ex.state) {
        logger.info(`Code gen loaded state, NOT learning`);
      } else {
        logger.info(`Code gen got no state, START learning`);
        await ex.init(this.examples, this.questions);
        await ex.learn();
        await ex.save();
      }
    }
  }

  async finish(cursor) {
    await cursor.ctx.extractor.clear();
  }

  async process({ cursor, item }, cb) {
    logger.debug(`${this} Getting ${JSON.stringify(this.questions)} from ${item}`);
    const start = (new Date()).getTime();
    const ex = cursor.ctx.extractor;

    const stream = ex.stream(
      item,
      this.questions,
      {
        single: this.single,
        maxPages: this.maxPages,
      });

    for await (const output of stream) {
      const took = (new Date()).getTime() - start;
      logger.debug(`${this } Extract took ${(took/1000).toFixed(1)} sec so far`);
      const combined = { ...item, ...output };
      logger.debug(`${this} Yielding ${JSON.stringify(combined).substr(0, 360)}`);
      const done = cb(combined);
      if (done) break;
      if (this.single) break;
    }
  }
}
