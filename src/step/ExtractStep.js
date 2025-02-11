import { logger } from '../log/logger.js';
import { Document } from '../document/Document.js';
import { BaseStep } from './BaseStep.js';
import { isPlainObject } from '../util.js';

export const ExtractStep = class extends BaseStep {
  constructor(args) {
    super(args);

    if (args?.single) {
      this.single = !!args.single;
      delete args.single;
    }
    if (args?.view) {
      this.view = args.view;
      delete args.view;
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

  async finish(cursor) {
    await cursor.ctx.extractor.clear();
  }

  async process({ cursor, item, index }, cb) {
    logger.debug(`${this} Getting ${JSON.stringify(this.questions)} from ${item}`);
    const start = (new Date()).getTime();

    const ex = cursor.ctx.extractor;

    try {
      const stream = ex.stream(
        item,
        this.questions,
        {
          single: this.single,
          maxPages: this.maxPages,
          fetchOptions: { priority: index },
          view: this.view,
        });
      for await (const output of stream) {
        const took = (new Date()).getTime() - start;
        logger.debug(`${this } Extract took ${(took/1000).toFixed(1)} sec so far`);
        let combined;
        if (item instanceof Document) {
          combined = output;
        } else {
          combined = { ...item, ...output };
        }
        logger.debug(`${this} Yielding ${JSON.stringify(combined).substr(0, 360)}`);

        const done = cb(combined);
        if (done) {
          break;
        }
        if (this.single) {
          break;
        }
      }
    } catch (e) {
      logger.error(`${this} Got error: ${e}`);
      throw e;
    }
  }
}
