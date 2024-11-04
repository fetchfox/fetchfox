import { logger } from '../log/logger.js';
import { Item } from '../item/Item.js';
import { BaseExtractor } from './BaseExtractor.js';
import { iterative, findMultiDescription } from './prompts.js';
import { getExtractor } from './index.js';

export const CodeGenExtractor = class extends BaseExtractor {
  constructor(options) {
    super(options);
    this.helper = getExtractor(options?.helper);
  }

  async attemptCodeGenForMulti(doc, sample, questions) {
    const itemDescription = await this.findDescription(doc, sample, questions);
  }

  async findDescription(doc, sample, questions) {
    const chunks = this.chunks(doc);

    const context = {
      url: doc.url,
      html: chunks[0].html,
      text: chunks[0].text,
      sample: JSON.stringify(sample, null, 2),
      questions: JSON.stringify(questions, null, 2),
    };
    const prompt = findMultiDescription.render(context);

    console.log('prompt', prompt);

    const answer = await this.ai.ask(prompt, { format: 'json' });
    console.log('answer:', answer.partial);

    throw 'STOP';
  }

  async *run(target, questions, options) {
    const doc = await this.getDoc(target);

    console.log('doc:' + doc);
    console.log('helper:', this.helper);

    let sample = [];
    for await (const item of this.helper.stream(target, questions, options)) {
      sample.push(item);
      break;

      // if (sample.length >= 3) {
      //   break;
      // }
    }

    // if (sample.length == 0) {
    //   throw 'TODO: handle no results';
    // } else if (sample.length == 1) {
    //   throw 'TODO: handle single result';
    // } else {
      // Multi result scrape
      await this.attemptCodeGenForMulti(doc, sample, questions);
    // }

    console.log('sample:', sample);

    throw 'CODE GEN';

    // const { stream } = options || {};

    // const doc = await this.getDoc(target);
    // const chunks = this.chunks(doc);

    // const chunkQuestion = async (chunk, question) => {
    //   const { text, html } = chunk;
    //   const context = {
    //     url: doc.url,
    //     question,
    //     text,
    //     html,
    //   };

    //   const prompt = iterative.render(context);
    //   const answer = await this.ai.ask(prompt, { format: 'text' });

    //   return answer?.delta || '(not found)';
    // }

    // const max = Math.min(3, chunks.length);
    // const data = {};
    // logger.info(`Running iterative extractor on ${max} chunks`);
    // for (let i = 0; i < max; i++) {
    //   for (const question of questions) {
    //     const chunk = chunks[i];
    //     if (!this.isMissing(data, question)) continue;
    //     logger.info(`Asking "${question}" about ${doc}`);
    //     const answer = await chunkQuestion(chunk, question);
    //     logger.info(`Got answer ${(answer || '').substr(0, 50)}`);
    //     data[question] = answer;
    //   }

    //   if (this.countMissing(data, questions) == 0) {
    //     break;
    //   }
    // }

    // yield Promise.resolve(new Item(data, doc));
  }
}
