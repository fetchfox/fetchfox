import { Item } from '../item/Item.js';
import { BaseExtractor } from './BaseExtractor.js';
import * as prompts from './prompts.js';
import { getKV } from '../kv/index.js';

export const DirectExtractor = class extends BaseExtractor {
  constructor(options) {
    super(options);
    this.kv = options?.kv || getKV();
  }

  async *_run(doc, questions, options) {
    this.logger.info(`${this} Extracting from ${doc} in ${this}: ${JSON.stringify(questions)}`);

    const extraRules = modeRules(options?.mode || 'auto');

    const preQuestions = {
      _captcha: 'Is there a captcha blocking access to the content on this page? "yes" or "no". Answer "yes" only if the captcha obscures the entire page or the main data.',
      _login: 'Is the main content on this page blocked due to a login form? Answer "yes" ONLY if there is not much content aside from a login form. Otherwise answer "no"',
      _error: 'Are there any other errors or issues that prevent data from being scraped? answer "yes" or "no"',
      _reasoning: 'In ~5-15 words, explaining your reasoning for how you will get data from this page. If there are issues like captchas, login blocks, or errors, raise those. Otherwise, explain where and how you will get the data. Be succint and specific. Try to get data EVEN IF there is a login form or error, whenever possible.',
    };

    const postQuestions = {
      _confidence: 'Rate your confidence in this result, on a scale of 1..100',
    };

    const fullQuestions = { ...preQuestions, ...questions, ...postQuestions };

    const context = {
      url: doc.url,
      questions: JSON.stringify(fullQuestions, null, 2),
      body: doc.html,
      extraRules,
    };

    let scrapePrompts = await prompts.scrapeOnce.renderMulti(context, 'body', this.ai);
    const max = 32
    if (scrapePrompts.length > max) {
      this.logger.warn(`${this} Got too many prompts (${scrapePrompts.length}), only processing ${max}`);
      scrapePrompts = scrapePrompts.slice(0, max);
    }

    try {
      for (const prompt of scrapePrompts) {
        const gen = this.ai.stream(prompt, { format: 'jsonl' });
        for await (const { delta } of gen) {
          if (delta._meta) {
            this.logger.debug(`${this} Skipping meta result: ${JSON.stringify(delta)} for ${doc.url}`);
            continue;
          }

          yield Promise.resolve(new Item(delta, doc));
        }
      }
    } catch (e) {
      this.logger.error(`${this} Got error while extracting: ${e}`);
      throw e;
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
