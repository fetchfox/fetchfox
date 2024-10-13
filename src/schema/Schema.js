import { logger } from '../log/logger.js';
import { Item } from '../item/Item.js';
import { getAI } from '../ai/index.js';
import { shuffle, chunkList } from '../util.js';
import { schema } from './prompts.js';

export const Schema = class {
  constructor(options) {
    const { ai, cache } = options || {};
    this.ai = getAI(ai, { cache });
  }

  async *run(items, targetSchema) {
    const maxBytes = this.ai.maxTokens / 2;
    const chunked = chunkList(items, maxBytes);

    let matches = [];
    let count = 0;

    for (let i = 0; i < chunked.length; i++) {
      const chunk = chunked[i];
      const prompt = schema.render({
        schema: JSON.stringify(targetSchema, null, 2),
        items: JSON.stringify(items, null, 2),
      });

      const answer = await this.ai.ask(
        prompt,
        {
          format: 'json',
          schema: { items: [targetSchema] },
        });

      for (const item of (answer?.partial?.items || [])) {
        yield Promise.resolve(item);
      }
    }
  }
}
