import { Item } from '../item/Item.js';
import { logger } from '../log/logger.js';
import { DefaultFetcher } from '../fetch/index.js';
import { BaseExtractor } from './BaseExtractor.js';
import { scrapeOnce } from './prompts.js';

export const SinglePromptExtractor = class extends BaseExtractor {
  constructor(options) {
    super(options);
  }

  async *_run(doc, questions, options) {
    logger.info(`Extracting from ${doc} in ${this}: ${JSON.stringify(questions)}`);

    const { stream } = options || {};
    let { description, limit, single } = options || {};
    let extraRules = '';
    if (single) {
      extraRules = `These rules OVERRIDE previous instructions:
- You must find ONLY ONE result`;
    }
    const context = {
      url: doc.url,
      questions: JSON.stringify(questions, null, 2),
      html: doc.html,
      extraRules,
      description: (
        description
      ? `You are looking for this type of item(s):\n\n${description}`
      : ''),
    };

    let prompts = await scrapeOnce.renderMulti(context, 'html', this.ai, this.cache);

    const max = 50;
    if (prompts.length > max) {
      logger.warn(`${this} Got too many prompts (${prompts.length}), only processing ${max}`);
      prompts = prompts.slice(0, max);
    }

    let count = 0;
    for (const prompt of prompts) {
      logger.debug(`${this} Streaming prompt ${++count} of ${prompts.length}`);
      const stream = this.ai.stream(prompt, { format: 'jsonl' });
      try {
        for await (const { delta } of stream) {
          if (delta.itemCount) continue;
          yield Promise.resolve(new Item(delta, doc));
        }
      } catch(e) {
        logger.error(`${this} Got error: ${e}`);
        throw e;
      }
    }
  }
}
