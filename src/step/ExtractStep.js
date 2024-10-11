import { logger } from '../log/logger.js';
import { getExtractor } from '../extract/index.js';
import { BaseStep } from './BaseStep.js';

export const ExtractStep = class extends BaseStep {
  static info = BaseStep.combineInfo({
    name: 'extract',
    description: 'Extract data from a page',
    args: {
      questions: {
        description: 'A list of questions describing the data to extract from a page. Format: array',
        example: ['What is the username of this profile?', 'What is the number of folllowers?', 'What is the bio?', 'What is the URL? Format: Absolute URL'],
      },
      single: {
        description: 'If true, the extraction will find only one item per page. If false, it can find multiple. Should correspond to the users desired number of results per page. Format: boolean',
        example: false
      },
    },
  });

  constructor(args) {
    super(args);

    let questions;
    if (typeof args == 'string') {
      questions = [args];
    } else if (Array.isArray(args)) {
      questions = args;
    } else {
      questions = args.questions;
    }

    if (!questions) throw new Error('No questions for extract step');

    this.questions = questions;
    this.single = args?.single;
  }

  async *run(cursor) {
    logger.info(`Extract for ${this.questions.join(', ')}`);

    for (const target of cursor.last) {
      logger.info(`Extract from ${target}`);
      for await (const item of cursor.ctx.extractor.stream(target, this.questions)) {
        yield Promise.resolve(item);
        if (this.single) break;
      }
    }
  }
}
