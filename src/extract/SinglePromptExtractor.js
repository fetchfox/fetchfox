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

    switch (mode) {
      case 'single':
        extraRules = `You are in SINGLE item extraction mode. Return EXACTLY ONE result. This rule overrides previous instructions.`;
        break;
      case 'multiple':
        extraRules = `You are in MULTIPLE item extraction mode. Return ONE OR MORE results. This rule overrides previous instructions.`;
        break;
      case 'auto':
        extraRules = `Before beginning extraction, return a single JSONL result that is an analysis result. The format will be like this:

{ "_meta": true, "pageType": "'detail' or 'list' or 'other'":, "analysis": "...your analysis here...", "mode": "'single' or 'multiple'"}

Field meanings:
- "_meta": indicates this is a meta result. Always true.
- "pageType": some pages are detail pages, which means they give detail on a single item. They may have links to similar items, or list multiple target items, but if the main point of this page is to give detail about a single specific item, say "detail". If this page's main point is to link to other detail pages, then say "list". If this page is in neither category, say "other"
- "analysis": given the page info, the pageType, analyze the situation in up to 20 words. The topic of your analysis is whether you should be extracting one item, or multiple items. To determine this, consider BOTH the user extraction goal, AND the content of the page. Are there multiple items on the page matching the user's goal? Or just one?
- "mode": Give all the above, should the extraction mode be "single" or "multiple"

Important: consider BOTH the page content, and also the URL of the page. Sometimes the URL will give clues about whether this is a detail page or a list page, and therefore single or multiple extraction.

* Once this analysis is complete, the REST of your response MUST respect the outcome of this analysis
* The "_meta" result does NOT count to the result limit. If you are in single mode, return one _meta result, and then one actual result.

`;
        break;
      default:
        throw new Error(`Unexpected mode: ${mode}`);
    }

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
          if (delta._meta) {
            logger.debug(`${this} Skipping meta result: ${JSON.stringify(delta)} for ${doc.url}`);
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
