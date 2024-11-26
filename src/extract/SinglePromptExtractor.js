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

    const { stream } = options || {};

    logger.debug(`Getting doc in ${this}`);

    const { extraRules, description, limit } = options || {};
    let { single } = options || {};
    if (single) single = {};

    logger.info(`Extracting from ${doc} in ${this}: ${JSON.stringify(questions)}`);

    // Executes scrape on a chunk of the text + HTML
    const that = this;
    const inner = async function* (chunk) {
      const { more, text, html } = chunk;

      const context = {
        url: doc.url,
        questions: JSON.stringify(questions, null, 2),
        text,
        html,
        extraRules,
        limit: limit || 'No limit',
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

    const chunks = this.chunks(doc);
    const max = 50;
    let count = 0;
    for (let i = 0; i < max && i < chunks.length; i++) {
      logger.debug(`Extraction iteration ${i + 1} of max ${max} for ${doc}`);
      for await (const result of inner(chunks[i])) {
        logger.debug(`Extraction found item (${++count} on this page): ${result.item}`);
        yield Promise.resolve(result.item);
      }
    }
  }
}
