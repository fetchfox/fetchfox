// import PQueue from 'p-queue';
import { clip } from '../util.js';
import { Item } from '../item/Item.js';
import { BaseExtractor } from './BaseExtractor.js';
import {
  PrettyTransformer,
  SelectorTransformer,
} from '../transform/index.js';
import { scrapeOnce, aiProcess } from './prompts.js';
import { getKV } from '../kv/index.js';
import { Author } from '../fetch/Author.js';

export const SinglePromptExtractor = class extends BaseExtractor {
  constructor(options) {
    super(options);
    this.kv = options?.kv || getKV();
  }

  async *_run(doc, questions, options) {
    this.logger.info(`Extracting from ${doc} in ${this}: ${JSON.stringify(questions)}`);

    let gen;
    if (process.env.USE_AUTHOR) {
      gen = this._runAuthor(doc, questions, options);
    } else {
      gen = this._runRegular(doc, questions, options);
    }

    for await (const r of gen) {
      yield Promise.resolve(r);
    }
  }

  async *_runRegular(doc, questions, options) {
    const transformers = [];
    if (process.env.USE_TRANSFORM) {
      transformers.push(new PrettyTransformer(this));
      transformers.push(new SelectorTransformer(questions, this));
    }

    let html = doc.html;
    for (const t of transformers) {
      html = await t.transform(html);
    }

    const extraRules = modeRules(options?.mode || 'auto');
    const context = {
      url: doc.url,
      questions: JSON.stringify(questions, null, 2),
      body: html,
      extraRules,
    };

    const view = options?.view || 'html'
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

  async aiProcess(item, questions) {
    const aiItem = {};
    for (const [key, val] of Object.entries(item)) {
      if (val.ai) {
        aiItem[key] = `Give a value for ${key}="${questions[key]}" using this data: ${val.ai}`;
      }
    }

    if (!Object.keys(aiItem).length) {
      return item;
    }

    const context = {
      item: JSON.stringify(aiItem, null, 2),
    };
    const { prompt } = await aiProcess.renderCapped(context, 'item', this.ai);

    const answer = await this.ai.ask(prompt, { format: 'json' });
    this.logger.debug(`${this} AI processing gave: ${clip(JSON.stringify(answer.partial), 200)}`);

    return { ...item, ...answer.partial };
  }

  async *_runAuthor(doc, questions, options) {
    const goal = goalPrompt(questions);
    const transformers = [];
    if (process.env.USE_TRANSFORM) {
      transformers.push(new PrettyTransformer(this));
      transformers.push(new SelectorTransformer(questions, this));
    }

    const url = doc.url;
    const author = new Author({
      fetcher: this.fetcher,
      kv: this.kv,
      ai: this.ai,
      cache: this.cache,
      logger: this.logger,
      transformers,
      timeout: 30 * 1000,  // TODO: figure out author timeout
    });

    const num = 5;

    /* eslint-disable no-async-promise-executor */
    const expectedPromise = new Promise(async (ok) => {
      const gen = this._runRegular(doc, questions, options);
      const results = [];
      for await (const r of gen) {
        results.push(r);
        if (results.length > num) {
          break;
        }
      }
      ok(results);
    });
    /* eslint-enable no-async-promise-executor */

    const expected = await expectedPromise;

    /* eslint-disable no-async-promise-executor */
    const actualPromise = new Promise(async (ok) => {
      const gen = author.run(url, [goal], expected);
      const results = [];
      for await (const v of gen) {
        for (const r of v.result) {
          results.push(r);
          if (results.length > num) {
            break;
          }
        }
        if (results.length > num) {
          break;
        }
      }
      ok(results);
    });
    /* eslint-enable no-async-promise-executor */

    const actual = await actualPromise;

    await author.iterate(doc.url, doc.html, [goal], expected, actual);

    yield Promise.resolve(null);
    throw 'STOP';

    // for await (const val of author.run(url, [goal])) {
    //   // Sometimes AI serializes the results in JSON
    //   if (typeof val.result == 'string') {
    //     try {
    //       val.result = JSON.parse(vale.result);
    //     } catch (e) {
    //     }
    //   }

    //   const list = Array.isArray(val.result) ? val.result : [val.result]
    //   this.logger.debug(`${this} Got ${list.length} results from author: ${clip(list, 200)}`);

    //   const chan = createChannel();
    //   const q = new PQueue({ concurrency: 32 });
    //   const all = [];
    //   for (const item of list) {
    //     const task = q.add(async () => {
    //       const r = await this.aiProcess(item, questions);
    //       chan.send({ item: r });
    //     });
    //     all.push(task);
    //   }
    //   const p = Promise.allSettled(all)
    //     .then(() => chan.end());

    //   for await (const val of chan.receive()) {
    //     if (val.end) {
    //       break;
    //     }
    //     yield Promise.resolve(new Item(val.item));
    //   }

    //   await p;
    // }
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

const goalPrompt = (questions) => {
  return `Extract data from this page, and all extracted data as JSON objects in an array. The data you are extracting must match this template:

${JSON.stringify(questions, null, 2)}

Send all items as an array of JSON objects, like this:

[
  ${JSON.stringify(questions)},
  ${JSON.stringify(questions)},
  ${JSON.stringify(questions)},
  // ... and so on
]

  Important: Sometimes, you will get subjective fields, asking to do summaries, make judgemnet calls, compare things, change formats, and so on. Anything that seem subjective or hard to do in code, you can us an AI LLM todo. To do this, wrap data in the ai(), and that field will be sent to an AI for post processing. For example, if you get this:

  { "summary": "Summarize this article in 50 words" }

Send items like this:

  { "summary": { ai: "...inputData needed to generate summary..." } }

For "inputData", you want to send ALL the data necessary for the subjective field. Feel free to include as little or as much data as necessary. Do NOT format the data in any way, simply include the data needed to generate that field. This data typically should NOT a simple recap of the other fields, but usually general relevant data from the page.

Give only string values in the output.

Your response will be machine parsed using JSON.stringify() and interpretted as an array, so you MUST use this return format`;
}
