import { Item } from '../item/Item.js';
import { logger } from '../log/logger.js';
import { DefaultFetcher } from '../fetch/index.js';
import { BaseExtractor } from './BaseExtractor.js';
import { scrapeOnce } from './prompts.js';
import { AIError } from '../ai/AIError.js';

export const SinglePromptExtractor = class extends BaseExtractor {
  constructor(options) {
    super(options);
  }

  async *_run(doc, questions, options) {

    const { stream } = options || {};

    logger.debug(`Getting doc in ${this}`);

    const { extraRules, description, limit } = options || {};
    let { single } = options || {};
    if (single) single = {};

    logger.info(`Extracting from ${doc} in ${this}: ${JSON.stringify(questions)}`);
    const that = this;
    const inner = async function* (html) {
      const context = {
        url: doc.url,
        questions: JSON.stringify(questions, null, 2),
        html,
        extraRules,
        description: (
          description
            ? `You are looking for this type of item(s):\n\n${description}`
            : ''),
      };
      const prompt = scrapeOnce.render(context);

      const stream = that.ai.stream(prompt, { format: 'jsonl' });
      for await (const { delta } of stream) {
        if (delta.itemCount) continue;
        yield Promise.resolve({
          item: new Item(delta, doc),
        });
      }
    }

    const chunks = await doc.htmlChunks((str) => this.ai.countTokens(str), this.ai.maxTokens - 20000);
    const max = 50;
    let count = 0;
    for (let i = 0; i < max && i < chunks.length; i++) {
      console.log('chunk', i, max, chunks.length);
      console.log('tokens:', this.ai.countTokens(doc.html));

      logger.debug(`Extraction iteration ${i + 1} of max ${max} for ${doc}`);
      for await (const result of inner(chunks[i])) {
        logger.debug(`Extraction found item (${++count} on this page): ${result.item}`);
        yield Promise.resolve(result.item);
      }
    }
  }
}
