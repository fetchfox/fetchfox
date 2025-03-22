import { logger } from '../log/logger.js';
import { Item } from '../item/Item.js';
import { getAI } from '../ai/index.js';
import { chunkList } from '../util.js';
import { filter } from './prompts.js';

export const Filter = class {
  constructor(options) {
    this.ai = options?.ai || getAI();
  }

  async *run(items, query) {
    let id = 1;
    const maxBytes = this.ai.maxTokens / 2;
    const chunked = chunkList(items, maxBytes);

    let count = 0;

    for (let i = 0; i < chunked.length; i++) {
      const chunk = chunked[i];
      const prompt = filter.render({
        query,
        items: JSON.stringify(chunk, null, 2),
      });

      const stream = this.ai.stream(prompt, { format: 'jsonl' });
      for await (const { delta } of stream) {
        const copy = JSON.parse(JSON.stringify(delta));
        const p = copy._percentMatch || 0;;
        delete copy._percentMatch;
        if (p >= 80) {
          yield Promise.resolve(new Item(copy));
        }
      }
    }

    logger.info(`Filter matched ${count} out of original ${items.length}`);
  }
}
