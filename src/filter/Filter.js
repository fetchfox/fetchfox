import { logger } from '../log/logger.js';
import { getAI } from '../ai/index.js';
import { shuffle, chunkList } from '../util.js';
import { filter } from './prompts.js';

export const Filter = class {
  constructor(options) {
    const { ai, cache } = options || {};
    this.ai = getAI(ai, { cache });
  }

  async *run(items, query) {
    let id = 1;
    const copy = shuffle([...items])
      .map(item => { return { ...item, _ffid: id++ } });
    const maxBytes = this.ai.maxTokens / 2;
    const chunked = chunkList(copy, maxBytes);

    let matches = [];
    let count = 0;

    for (let i = 0; i < chunked.length; i++) {
      const chunk = chunked[i];
      const prompt = filter.render({
        query,
        items: JSON.stringify(copy, null, 2),
      });

      const stream = this.ai.stream(prompt, { format: 'jsonl' });
      for await (const { delta, usage } of stream) {
        const matchId = delta._ffid;
        for (const item of copy) {
          if (item._ffid == delta._ffid) {
            count++;
            delete item._ffid;
            console.log('Filter YIELD', item);
            yield Promise.resolve(item);
          }
        }
      }
    }

    logger.info(`Filter matched ${count} out of original ${items.length}`);
  }
}
