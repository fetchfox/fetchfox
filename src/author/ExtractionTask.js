import { shortObjHash } from '../util.js';
import { Item } from '../item/index.js';
import { getExtractor } from '../extract/index.js';
import { BaseTask } from './BaseTask.js';

export const ExtractionTask = class extends BaseTask {
  constructor(namespace, questions, options) {
    super(options);
    this.namespace = namespace;
    this.questions = questions;
    this.extractor = options?.extractor || getExtractor();
  }

  get goals() {
    return [goalPrompt(this.questions)];
  }

  get key() {
    const hash = shortObjHash({ questions: this.questions });
    return `extraction-task-${this.namespace}-${hash}`;
  }

  async expected(urls, limit) {
    let str = '';
    for (const url of urls) {
      let count = 0;
      str += `>>> Example results A sample of results for ${url}, limited to first ${limit}. These are *not* all the results, just the first ${limit} examples:\n\n[\n`;
      const gen = this._expected(url);
      for await (const r of gen) {
        str += '  ' + JSON.stringify(new Item(r).publicOnly()) + '\n'
        if (++count >= limit) {
          break;
        }
      }
      str += '\n  //...more results here...\n]\n\n';
    }
    return str;
  }

  async *_expected(url) {
    const gen = this.extractor.run(url, this.questions);
    for await (const r of gen) {
      yield Promise.resolve(r);
    }
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

# Retries
If your extraction gave an array with length == 0, retry extraction twice after waiting 5 seconds each. This may have been due to a page load delay.

# Subjective fields
Sometimes, you will get subjective fields, asking to do summaries, make judgemnet calls, compare things, change formats, and so on. Anything that seem subjective or hard to do in code, you can us an AI LLM todo. To do this, return an object with the shape { ai: '...string...' }, and that string in that object will be sent to an AI for post processing. For example, if you get this:

  { "summary": "Summarize this article in 50 words" }

Send items like this:

  { "summary": { ai: "...inputData needed to generate summary..." } }

For "inputData", you want to send ALL the data necessary for the subjective field. Feel free to include as little or as much data as necessary. Do NOT format the data in any way, simply include the data needed to generate that field. This data typically should NOT a simple recap of the other fields, but usually general relevant data from the page.

Make sure to ONLY use { ai: '...string...' } for SUBJECTIVE fields that REQUIRE an AI to analyze. Do not use it for data that is readily available on the page.

Give only string values in the output.

Your response will be machine parsed using JSON.stringify() and interpretted as an array, so you MUST use this return format`;
}
