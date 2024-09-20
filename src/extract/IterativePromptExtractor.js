import { logger } from '../log/logger.js';
import { Item } from '../item/Item.js';
import { BaseExtractor } from './BaseExtractor.js';
import { iterative } from './prompts.js';

export const IterativePromptExtractor = class extends BaseExtractor {
  constructor(options) {
    super(options);
  }

  async *run(target, questions, options) {
    const { stream } = options || {};

    const doc = await this.getDoc(target);
    const chunks = this.chunks(doc);

    const chunkQuestion = async (chunk, question) => {
      const { text, html } = chunk;
      const context = {
        url: doc.url,
        question,
        text,
        html,
      };

      const prompt = iterative.render(context);
      const answer = await this.ai.ask(prompt, { format: 'text' });

      return answer?.delta || '(not found)';
    }

    const max = Math.min(3, chunks.length);
    const data = {};
    logger.info(`Running iterative extractor on ${max} chunks`);
    for (let i = 0; i < max; i++) {
      for (const question of questions) {
        const chunk = chunks[i];
        if (!this.isMissing(data, question)) continue;
        logger.info(`Asking "${question}" about ${doc}`);
        const answer = await chunkQuestion(chunk, question);
        logger.info(`Got answer ${(answer || '').substr(0, 50)}`);
        data[question] = answer;
      }

      if (this.countMissing(data, questions) == 0) {
        break;
      }
    }

    yield Promise.resolve(new Item(data, doc));
  }
}
