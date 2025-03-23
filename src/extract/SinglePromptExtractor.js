import { Item } from '../item/Item.js';
import { BaseExtractor } from './BaseExtractor.js';
// import { Transformer } from './Transformer.js';
import { scrapeOnce, scrapeSelect, scrapeJson } from './prompts.js';
import { getAI } from '../ai/index.js';
import { getKV } from '../kv/index.js';
import { Author } from '../fetch/Author.js';

export const SinglePromptExtractor = class extends BaseExtractor {
  constructor(options) {
    super(options);
    this.kv = options?.kv || getKV();
  }

  useTransformer(url) {
    return (
      url.includes('domain.com.au') ||
      url.includes('onereal.com/search-agent') ||
      url.includes('www.kw.com')
    );
  }

  aiLog(msg) {
    console.log('AI says:', msg);
  }

  async *_run(doc, questions, options) {
    this.logger.info(`Extracting from ${doc} in ${this}: ${JSON.stringify(questions)}`);

    let { mode } = options || {};
    const extraRules = modeRules(mode);

    // let body;
    // if (false && this.useTransformer(doc.url)) {
    //   const trans = new Transformer();
    //   body = await trans.reduce(doc.html, questions);
    // } else {
    //   let view = options?.view || 'html';
    //   if (!['html', 'text', 'selectHtml'].includes(view)) {
    //     this.logger.error(`${this} Invalid view, switching to HTML: ${view}`);
    //     view = 'html';
    //   }
    //   body = doc[view];
    // }

    // TODO: Cleanup
    // let view = options?.view || 'html';
    let view = 'selectHtml';

    if (!['html', 'text', 'selectHtml', 'json'].includes(view)) {
      this.logger.error(`${this} Invalid view, switching to HTML: ${view}`);
      view = 'html';
    }

    if (['selectHtml', 'json'].includes(view)) {
      const ai = getAI('openai:gpt-4o');
      if (!doc.learned) {
        await doc.learn(ai, questions);
      }
    }
    const body = doc[view];
    console.log('body', doc.selectHtml);

//     const author = new Author({
//       kv: this.kv,
//       ai: this.ai,
//       logger: this.logger,
//       timeout: 10 * 1000,
//     });

//     const namespace = 'namespace';
//     const goal = `Send JSON objects that match this template:

// ${JSON.stringify(questions, null, 2)}
// `;

//     const url = doc.url;
//     const init = async () => {
//       const ctx = {};
//       await this.fetcher.start(ctx);
//       await this.fetcher.goto(url, ctx);
//       const doc = await this.fetcher.current(ctx);
//       // const doc = await this.current(this.fetcher, ctx);
//       if (!doc) {
//         throw new Error(`${this} Couldn't get document to learn commands ${url}`);
//       }
//       return { html: doc.html, ctx };
//     }
//     const exec = async (fn, cb, { ctx }) => {
//       return fn(ctx.page, cb, (msg) => this.aiLog(msg), cb);
//     }
//     const finish = async ({ ctx }) => {
//       this.fetcher.finish(ctx);
//     }

//     console.log('made author:', author);
//     const fn = await author.get(namespace, goal, init, exec, finish);
//     console.log('got fn:', fn);

//     throw 'STOP';

    const context = {
      url: doc.url,
      questions: JSON.stringify(questions, null, 2),
      body,
      extraRules,
    };

    let prompts;
    if (view == 'selectHtml') {
      context.hint = doc.learned?.hint;
      prompts = await scrapeSelect.renderMulti(context, 'body', this.ai);
    } else if (view == 'json') {
      context.hint = doc.learned?.hint;
      prompts = await scrapeJson.renderMulti(context, 'body', this.ai);
    } else {
      prompts = await scrapeOnce.renderMulti(context, 'body', this.ai);
    }

    const max = 32
    if (prompts.length > max) {
      this.logger.warn(`${this} Got too many prompts (${prompts.length}), only processing ${max}`);
      prompts = prompts.slice(0, max);
    }

    try {
      for (const prompt of prompts) {
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
