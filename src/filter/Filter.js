import { logger } from '../log/logger.js';
import { Item } from '../item/Item.js';
import { getAI } from '../ai/index.js';
import { chunkList } from '../util.js';
import { filter } from './prompts.js';

export const Filter = class {
  constructor(options) {
    const { ai, cache } = options || {};
    this.ai = getAI(ai, { cache });
  }

  async *run(items, query) {
    let id = 1;
    const copy = [...items]
      .map(item => { return { ...item, _ffid: id++ } });

    const maxBytes = this.ai.maxTokens / 2;
    const chunked = chunkList(copy, maxBytes);

    let matches = [];
    let count = 0;

    for (let i = 0; i < chunked.length; i++) {
      const chunk = chunked[i];
      const prompt = filter.render({
        query,
        items: JSON.stringify(chunk, null, 2),
      });

      const stream = this.ai.stream(prompt, { format: 'jsonl' });
      for await (const { delta, usage } of stream) {
        const matchId = delta._ffid;
        for (let i = 0; i < copy.length; i++) {
          const orig = items[i];
          const data = copy[i];
          if (data._ffid == delta._ffid) {
            count++;
            delete data._ffid;
            yield Promise.resolve(new Item(data));
          }
        }
      }
    }

    logger.info(`Filter matched ${count} out of original ${items.length}`);
  }
}
