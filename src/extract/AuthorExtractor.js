import PQueue from 'p-queue';
import { createChannel, clip } from '../util.js';
import { Item } from '../item/Item.js';
import { BaseExtractor } from './BaseExtractor.js';
import {
  PrettyTransformer,
  SelectorTransformer,
} from '../transform/index.js';
import { scrapeOnce, aiProcess } from './prompts.js';
import { getKV } from '../kv/index.js';
import { DirectExtractor } from './DirectExtractor.js';
import { Author, ExtractionTask } from '../author/index.js';

export const AuthorExtractor = class extends BaseExtractor {
  constructor(options) {
    super(options);
    this.kv = options?.kv || getKV();
    this.baseline = new DirectExtractor(options);
  }

  async *_run(doc, questions, options) {
    this.logger.info(`${this} Extracting from ${doc} in ${this}: ${JSON.stringify(questions)}`);

    const url = doc.url;
    const namespace = new URL(url).host;
    const task = new ExtractionTask(namespace, questions, { extractor: this.baseline });
    const expected = await task.expected([url], 5);

    // const goal = goalPrompt(questions);
    const transformers = [];
    // if (process.env.USE_TRANSFORM) {
    //   transformers.push(new PrettyTransformer(this));
    //   transformers.push(new SelectorTransformer(questions, this));
    // }

    const author = new Author({
      fetcher: this.fetcher,
      kv: this.kv,
      ai: this.ai,
      cache: this.cache,
      logger: this.logger,
      transformers,
      timeout: 30 * 1000,  // TODO: figure out author timeout
    });

    const { script } = await author.get(task, [url]);
    const gen = await author.run(task, [url], script);

    // for await (const r of gen) {
    //   console.log('R:', r.result);
    //   console.log('R len:', r.result?.length);
    // }

    // for await (const val of author.run(url, [goal])) {
    for await (const val of gen) {
      console.log('val.result', val.result);

      // Sometimes AI serializes the results in JSON
      if (typeof val.result == 'string') {
        try {
          val.result = JSON.parse(val.result);
        } catch (e) {
        }
      }

      const list = Array.isArray(val.result) ? val.result : [val.result]
      this.logger.debug(`${this} Got ${list.length} results from author: ${clip(list, 200)}`);

      // Handle any fields that need AI post-processing
      const chan = createChannel();

      console.log('make channel');

      const q = new PQueue({ concurrency: 32 });
      const all = [];
      for (const item of list) {
        const task = q.add(async () => {
          const r = await this.aiProcess(item, questions);
          chan.send({ item: r });
        });
        all.push(task);
      }

      let p;
      if (process.env.STRICT_ERRORS) {
        p = Promise.all(all);
      } else {
        p = Promise.allSettled(all);
      }
      p = p.then(() => chan.end());

      for await (const r of chan.receive()) {
        if (r.end) {
          break;
        }
        yield Promise.resolve(new Item(r.item));
      }

      await p;
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
