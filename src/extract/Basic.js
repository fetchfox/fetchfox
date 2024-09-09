import { Item } from '../item/Item.js';
import { logger } from '../log/logger.js';
import { basic } from './prompts.js';

export const Basic = class {
  constructor(ai) {
    this.ai = ai;
  }

  async extract(doc, questions, cb, options) {
    const maxTokens = this.ai.maxTokens;
    const textChunkSize = maxTokens * 4 * 0.1;
    const htmlChunkSize = maxTokens * 4 * 0.25;

    const { extraRules, description, limit } = options || {};

    logger.info(`Extracting from ${doc}: ${questions.join(', ')}`);

    const text = doc.text || '';
    const html = doc.html || '';

    // Executes scrape on a chunk of the text + HTML
    const inner = async (offset, existing, cb) => {
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
        description: description ? `You are looking for this type of item(s):\n\n${description}` : '',
      };

      let prevLength = 1;  // set it to 1 to ignore itemCount row
      const prompt = basic.render(context);

      // TODO: Remove duplicated code for partial / full result handling
      let result = [];
      const abort = () => limit && result.length >= limit;
      const { answer, didAbort } = await this.ai.ask(
        prompt,
        async ({ partial }) => {
          if (partial && partial.length > prevLength) {
            const delta = partial
              .slice(prevLength)
              .map(i => new Item(i, doc));

            result = existing.concat(
              partial.slice(1).map(i => new Item(i, doc)));

            prevLength = partial.length;

            for (const d of delta) {
              logger.info(`Extraction delta: ${d}`);
            }

            cb && cb({ delta, partial: result });
          }
        },
        { abort });

      const ensureArray = (x) => {
        if (!x) return [];
        if (!Array.isArray(x)) return [x];
        return x;
      }

      const items = ensureArray(answer)
        .filter(i => i.itemCount == undefined || Object.keys(i).length > 1)
        .map(i => new Item(i, doc));

      let single = false;
      if (items.length == 1) {
        single = true;
        for (const key of Object.keys(items[0].data)) {
          if (!items[0].data[key] || items[0].data[key] == '(not found)') {
            single = false;
          }
        }
      }

      const more = (
        text.length > (offset + 1) * textChunkSize ||
        html.length > (offset + 1) * htmlChunkSize);

      const shouldContinue = !didAbort && more && !single;

      return { items, shouldContinue };
    }

    // Iterate ate most 3 times over chunks of the text + HTML
    let result = [];
    for (let i = 0; i < 3; i++) {
      const { items, shouldContinue } = await inner(i, result, cb);
      result.push(...items);
      if (!shouldContinue) break;
    }

    if (limit) {
      result = result.slice(0, limit);
    }

    return { items: result };
  }
}
