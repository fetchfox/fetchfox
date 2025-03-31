import { logger as defaultLogger } from '../log/logger.js';
import { Item } from '../item/Item.js';
import { getAI } from '../ai/index.js';
import { chunkList } from '../util.js';
import { filter } from './prompts.js';

export const Filter = class {
  constructor(options) {
    this.logger = options?.logger || defaultLogger;
    this.ai = options?.ai || getAI();
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  async *run(items, query) {
    const maxBytes = this.ai.maxTokens / 2;
    const chunked = chunkList(items, maxBytes);

    let count = 0;

    for (let i = 0; i < chunked.length; i++) {
      const chunk = chunked[i];
      const prompt = filter.render({
        query,
        items: JSON.stringify(chunk, null, 2),
      });

      const stream = await this.ai.stream(prompt, { format: 'jsonl' });
      for await (const { delta } of stream) {
        this.logger.debug(`${this} Got filter rated: ${JSON.stringify(delta)}`);
        const copy = JSON.parse(JSON.stringify(delta));
        let p;
        try {
          p = parseInt(copy._percentMatch || 0);
          delete copy._percentMatch;
        } catch {
          p = 0;
        }
        if (p >= 80) {
          yield Promise.resolve(new Item(copy));
        }
      }
    }

    this.logger.info(`Filter matched ${count} out of original ${items.length}`);
  }
}
