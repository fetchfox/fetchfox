import { Document } from '../document/Document.js';
import { BaseStep } from './BaseStep.js';
import { isPlainObject } from '../util.js';
import { stepDescriptionsMap } from './info.js';

export const ExtractStep = class extends BaseStep {
  constructor(args) {
    super(args);

    const modeChoices = stepDescriptionsMap.extract.args.mode.choices;
    if (args?.mode && modeChoices.includes(args.mode)) {
      this.mode = args?.mode;
      delete args.mode;
    }

    const viewChoices = stepDescriptionsMap.extract.args.view.choices;
    if (args?.view && viewChoices.includes(args.view)) {
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

    this.view ??= 'html';
    this.mode ??= 'auto';
    this.maxPages ??= 1;
  }

  async finish(cursor) {
    await cursor.ctx.extractor.clear();
  }

  async process({ cursor, item, index }, cb) {
    cursor.ctx.logger.debug(`${this} Getting ${JSON.stringify(this.questions)} from ${item}`);
    const start = (new Date()).getTime();
    const ex = cursor.ctx.extractor;

    try {
      const stream = ex.stream(
        item,
        this.questions,
        {
          mode: this.mode,
          view: this.view,
          maxPages: this.maxPages,
          hint: this.hint,
          fetchOptions: {
            priority: index,
            hint: this.hint,
            instructionsCacheKey: `index-${index}`,
          },
        });
      for await (const output of stream) {
        const took = (new Date()).getTime() - start;
        cursor.ctx.logger.debug(`${this } Extract took ${(took/1000).toFixed(1)} sec so far`);
        let combined;
        if (item instanceof Document) {
          combined = output;
        } else {
          // TODO: intelligently merge so new stuff goes first, and isn't overriden
          combined = { ...item, ...output };
        }
        cursor.ctx.logger.debug(`${this} Yielding ${JSON.stringify(combined).substr(0, 360)}`);

        const done = cb(combined);
        if (done) {
          break;
        }
        if (this.mode == 'single') {
          break;
        }
      }
    } catch (e) {
      cursor.ctx.logger.error(`${this} Got error: ${e}`);
      throw e;
    }
  }
}
