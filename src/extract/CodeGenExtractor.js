import { logger } from '../log/logger.js';
import { Item } from '../item/Item.js';
import { BaseExtractor } from './BaseExtractor.js';
import { getExtractor } from './index.js';
import { codeGen } from './prompts.js';

export const CodeGenExtractor = class extends BaseExtractor {
  constructor(options) {
    super(options);
    this.helper = getExtractor(options.helper, options);
  }

  async *run(target, questions, options) {
    const { stream } = options || {};

    const doc = await this.getDoc(target);

    logger.info(`Getting example helper ${this.helper}`);
    const example = await this.helper.one(doc, questions, options);

    console.log('example', example);

    const chunks = this.chunks(doc);
    const max = Math.min(3, chunks.length);
    const data = {};
    logger.info(`Running iterative code gen on ${max} chunks`);
    // for (let i = 0; i < max; i++) {
    for (const question of questions) {
      const context = {
        url: doc.url,
        question,
        answer: example[question],
        html: chunks[0].html,
      };
      const prompt = codeGen.render(context);

      const answer = await this.ai.ask(prompt, { format: 'text' });

      console.log('code gen said:', answer.delta);
      console.log('for:', doc.url);

      // if (!this.isMissing(data, question)) continue;
      // logger.info(`Asking "${question}" about ${doc}`);
      // const answer = await chunkQuestion(chunks[i], question);
      // logger.info(`Got answer ${(answer || '').substr(0, 50)}`);
      // data[question] = answer;
    }
    // }

    // const chunkQuestion = async (chunk, question) => {
    //   const { text, html } = chunk;
    //   const context = {
    //     url: doc.url,
    //     question,
    //     text,
    //     html,
    //   };

    //   const prompt = single.render(context);
    //   const answer = await this.ai.ask(prompt, { format: 'text' });
    //   return answer?.delta || '(not found)';
    // }


    //   if (this.countMissing(data, questions) == 0) {
    //     break;
    //   }
    // }

    // yield Promise.resolve(new Item(data, doc));
  }
}

