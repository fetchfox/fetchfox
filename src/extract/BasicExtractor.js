import { basic } from './prompts.js';
import { Item } from '../item/Item.js';
import { logger } from '../log/logger.js';
import { getAi } from '../ai/index.js';
import { DefaultFetcher } from '../fetch/index.js';

export const BasicExtractor = class {
  constructor(ai, { fetcher, cache }) {
    this.ai = getAi(ai, { cache });
    this.fetcher = fetcher || new DefaultFetcher({ cache });
  }

  async *run(target, questions, options) {
    const { stream } = options || {};

    let doc;
    if (typeof target == 'string') {
      doc = await this.fetcher.fetch(target);
    } else {
      doc = target;
    }

    const maxTokens = this.ai.maxTokens;

    const textChunkSize = maxTokens * 4 * 0.1;
    const htmlChunkSize = maxTokens * 4 * 0.25;

    const { extraRules, description, limit } = options || {};
    let { single } = options || {};
    if (single) single = {};

    logger.info(`Extracting from ${doc}: ${questions.join(', ')}`);

    const text = doc.text || '';
    const html = doc.html || '';

    // Executes scrape on a chunk of the text + HTML
    const ai = this.ai;
    const inner = async function* (offset) {
      const textPart = text.slice(
        offset * textChunkSize,
        (offset + 1) * textChunkSize);

      const htmlPart = html.slice(
        offset * htmlChunkSize,
        (offset + 1) * htmlChunkSize);

      const context = {
        url: doc.url,
        questions,
        text: textPart,
        html: htmlPart,
        extraRules,
        limit: limit || 'No limit',
        description: (
          description
          ? `You are looking for this type of item(s):\n\n${description}`
          : ''),
      };

      const prompt = basic.render(context);

      const more = (
        text.length > (offset + 1) * textChunkSize ||
        html.length > (offset + 1) * htmlChunkSize);

      const countMissing = (data) => {
        let c = 0;
        for (const q of questions) {
          if (!data[q] || data[q] == '(not found)') {
            c++
          }
        }
        return c;
      }

      let count = 0;
      let expectedCount;

      let gen = ai.gen(prompt, { format: 'jsonl', stream });
      for await (const { delta, usage } of gen) {
        if (delta.itemCount) {
          expectedCount = delta.itemCount;
          continue;
        }

        let r;
        if (single) {
          single = Object.assign({}, delta, single);
          r = single;
        } else {
          // Assume its a new result
          r = delta;
        }

        const done = (
          limit && count >= limit ||
          // Single complete item cases:
          expectedCount == 1 && countMissing(delta) == 0 ||
          single && countMissing(single) == 0);


        count++;
        if (single && !done && more) {
          continue;
        }

        yield Promise.resolve({
          item: new Item(r, doc),
          done,
          more,
        });

        return;
      }
    }

    let done;
    let more;
    const max = 3;
    for (let i = 0; i < max; i++) {
      logger.info(`Extraction iteration ${i + 1} of max ${max} for ${doc}`);
      for await (const result of inner(i)) {
        yield Promise.resolve(result.item);
        more = result.more;
        done = result.done;
        // if (done) break;
        // if (single) return;
      }

      if (done) break;
      if (!more) break;
      if (i + 1 == max) logger.warn(`Stopping extraction with some bytes left unprocessed for ${doc}`);
    }
  }

  async all(target, questions, options) {
    options = {...options, stream: false };
    let result = [];
    for await (const r of this.run(target, questions, options)) {
      result.push(r);
    }
    return result;
  }

  async one(target, questions, options) {
    options = {...options, stream: true };
    for await (const r of this.run(target, questions, options)) {
      return r;
    }
  }

  async *stream(target, questions, options) {
    options = {...options, stream: true };
    for await (const r of this.run(target, questions, options)) {
      yield Promise.resolve(r);
    }
  }
}
