import { Item } from '../item/Item.js';
import { logger } from '../log/logger.js';
import { BaseExtractor } from './BaseExtractor.js';
import { scrapeOnce } from './prompts.js';

export const SinglePromptExtractor = class extends BaseExtractor {
  constructor(options) {
    super(options);
  }

  async *_run(doc, questions, options) {
    logger.info(`Extracting from ${doc} in ${this}: ${JSON.stringify(questions)}`);

    let { description, mode } = options || {};
    let extraRules = '';

    console.log('mode:', mode);

    switch (mode) {
      case 'single':
        extraRules = `You are in SINGLE item extraction mode. Return EXACTLY ONE result. This rule overrides previous instructions.`;
        break;
      case 'multiple':
        extraRules = `You are in MULTIPLE item extraction mode. Return ONE OR MORE results. This rule overrides previous instructions.`;
        break;
      case 'auto':
        extraRules = `Before beginning extraction, return a single JSONL result that is an analysis result. The format will be like this:

{ "_meta": true, "analysis": "...your analysis here...", "mode": "'single' or 'multiple'", "itemCount": "a number, your guess at the number of results expected"}

* The topic of your analysis is whether you should be extracting one item, or multiple items. To determine this, consider the user extraction goal, and the content of the page. Are there multiple items on the page matching the user's goal? Or just one?

* After you complete the analysis, you must respect the results of this analysis. So if your analysis says there is a single item, return only one result. If you analysis says there are multiple items, return multiple results.`;
        break;
      default:
        throw new Error(`Unexpected mode: ${mode}`);
    }

    console.log('extraRules', extraRules);

    let view = options?.view || 'html';
    if (!['html', 'text', 'selectHtml'].includes(view)) {
      logger.error(`${this} Invalid view, switching to HTML: ${view}`);
      view = 'html';
    }
    const body = doc[view];

    const context = {
      url: doc.url,
      questions: JSON.stringify(questions, null, 2),
      html: body,
      extraRules,
      description: (
        description
      ? `You are looking for this type of item(s):\n\n${description}`
      : ''),
    };

    let prompts = await scrapeOnce.renderMulti(context, 'html', this.ai);

    const max = 50;
    if (prompts.length > max) {
      logger.warn(`${this} Got too many prompts (${prompts.length}), only processing ${max}`);
      prompts = prompts.slice(0, max);
    }

    let count = 0;
    for (const prompt of prompts) {
      logger.debug(`${this} Streaming prompt ${++count} of ${prompts.length}`);

      try {
        const stream = this.ai.stream(prompt, { format: 'jsonl' });
        for await (const { delta } of stream) {

          console.log('delta', delta);

          if (delta.itemCount) {
            continue;
          }
          yield Promise.resolve(new Item(delta, doc));
        }

      } catch(e) {
        logger.error(`${this} Got error while streaming: ${e}`);
        throw e;
      }
    }
  }
}
