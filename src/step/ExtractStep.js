import { Document } from '../document/Document.js';
import { BaseStep } from './BaseStep.js';
import { isPlainObject } from '../util.js';
import { stepDescriptionsMap } from './info.js';
import { AuthorExtractor, TransformExtractor } from '../extract/index.js';

const authorWhitelist = [
];
const transformWhitelist = [
  'curaleaf',
  'finefettle',
  // 'bidspotter',
];

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

  useAuthor(item) {
    if (process.env.USE_AUTHOR) {
      return true;
    }

    const json = JSON.stringify(item);
    for (const wl of authorWhitelist) {
      if (json.includes(wl)) {
        return true;
      }
    }
    return false;
  }

  useTransform(item) {
    if (process.env.USE_TRANSFORM) {
      return true;
    }

    const json = JSON.stringify(item);
    for (const wl of transformWhitelist) {
      if (json.includes(wl)) {
        return true;
      }
    }
    return false;
  }

  async process({ cursor, item, index }, cb) {
    cursor.ctx.logger.debug(`${this} Getting ${JSON.stringify(this.questions)} from ${item}`);
    const start = (new Date()).getTime();

    let ex;
    if (this.useTransform(item)) {
      ex = new TransformExtractor(cursor.ctx.extractor);
    } else if (this.useAuthor(item)) {
      ex = new AuthorExtractor({
        ...cursor.ctx.extractor,
        baseline: cursor.ctx.extractor,
      });
    } else {
      ex = cursor.ctx.extractor;
    }

    // console.log('ex', ex);
    // throw 'stop';

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
          const falsey = (val) => (
            val === undefined ||
            val === null ||
            val === '' ||
            val === '(not found)'
          );

          const mid = {};
          for (const [key, val] of Object.entries(item)) {
            mid[key] = val;
          }

          for (const [key, val] of Object.entries(output)) {
            const existing = mid[key];
            if (existing && falsey(val)) {
              continue;
            }
            mid[key] = val;
          }

          // Put new fields at the start
          combined = {};
          for (const key of [...Object.keys(output), ...Object.keys(item)]) {
            combined[key] = mid[key];
          }

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
