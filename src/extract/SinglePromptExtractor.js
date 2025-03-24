import { clip } from '../util.js';
import { Item } from '../item/Item.js';
import { BaseExtractor } from './BaseExtractor.js';
import { SelectorTransformer } from '../transform/index.js';
import { scrapeOnce, scrapeSelect, scrapeJson } from './prompts.js';
import { getAI } from '../ai/index.js';
import { getKV } from '../kv/index.js';
import { Author } from '../fetch/Author.js';

export const SinglePromptExtractor = class extends BaseExtractor {
  constructor(options) {
    super(options);
    this.kv = options?.kv || getKV();
  }

  async *_run(doc, questions, options) {
    this.logger.info(`Extracting from ${doc} in ${this}: ${JSON.stringify(questions)}`);

    const goal = `Send JSON objects that match this template:

${JSON.stringify(questions, null, 2)}

Send all items as an array of JSON objects`;

    const url = doc.url;
    const author = new Author({
      fetcher: this.fetcher,
      kv: this.kv,
      ai: this.ai,
      cache: this.cache,
      logger: this.logger,
      transformers: [new SelectorTransformer(questions, this)],
      timeout: 30 * 1000,  // TODO: figure out author timeout
    });

    for await (const val of author.run(url, [goal])) {
      this.logger.debug(`${this} Got result from author: ${clip(val, 100)}`);
      for (const r of val.result) {
        yield Promise.resolve(new Item(r));
      }
    }
  }
}

const modeRules = (mode) => {
  switch (mode) {
    case 'single':
      return `You are in SINGLE item extraction mode. Return EXACTLY ONE result. This rule overrides previous instructions.`;

    case 'multiple':
      return  `You are in MULTIPLE item extraction mode. Return ONE OR MORE results. This rule overrides previous instructions. Make sure to find ALL items.

* After every 25 items, return another "_meta" result with an update on your status, how many items you think you have left to find, and a FIRM instruction to yourself on how to proceed. No more than 100 words total.
* Consider the results of each _meta when looking for more results

{ "_meta": true, "analysis": "...your analysis here..."}`;

    case 'auto':
      return  `Before beginning extraction, return a single JSONL result that is an analysis result. The format will be like this:

{ "_meta": true, "pageType": "'detail' or 'list' or 'other'":, "analysis": "...your analysis here...", "mode": "'single' or 'multiple'"}

Field meanings:
- "_meta": indicates this is a meta result. Always true.
- "pageType": some pages are detail pages, which means they give detail on a single item. They may have links to similar items, or list multiple target items, but if the main point of this page is to give detail about a single specific item, say "detail". If this page's main point is to link to other detail pages, then say "list". If this page is in neither category, say "other"
- "analysis": given the page info, the pageType, analyze the situation in up to 20 words. The topic of your analysis is whether you should be extracting one item, or multiple items. To determine this, consider BOTH the user extraction goal, AND the content of the page. Are there multiple items on the page matching the user's goal? Or just one?
- "mode": Give all the above, should the extraction mode be "single" or "multiple"

Important: consider BOTH the page content, and also the URL of the page. Sometimes the URL will give clues about whether this is a detail page or a list page, and therefore single or multiple extraction.

* Once this analysis is complete, the REST of your response SHOULD respect the outcome of this analysis
* If instructed to find multiple items, make sure to find ALL items that match
* If instructed to find a single item, return ONLY return one actual result item
* The "_meta" result does NOT count to the result limit. If you are in single mode, return one _meta result, and then one actual result.
* If you are extracting multiple items, after every 25 items, return another "_meta" result with an update on your status, how many items you think you have left to find, and a FIRM instruction to yourself on how to proceed. No more than 100 words total.
* Consider the results of each _meta when looking for more results and deciding if you should stop`;

    default:
      throw new Error(`Unexpected mode: ${mode}`);
  }
}
