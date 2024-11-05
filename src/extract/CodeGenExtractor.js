import { logger } from '../log/logger.js';
import { Item } from '../item/Item.js';
import { BaseExtractor } from './BaseExtractor.js';
import { iterative, findMultiDescription, codeGenMulti } from './prompts.js';
import { getExtractor } from './index.js';
import * as nodeHtmlParser from 'node-html-parser';

export const CodeGenExtractor = class extends BaseExtractor {
  constructor(options) {
    super(options);
    this.helper = getExtractor(options?.helper);
    console.log('code gen ai', this.ai);
  }

  async attemptCodeGenForMulti(doc, sample, questions) {
    const itemDescription = await this.findDescription(doc, sample, questions);
    const fn = await this.writeCode(doc, sample, questions, itemDescription);

    let a;
    try {
      a = fn(doc.html);
    } catch(e) {
      a = 'code failed to execute';
      console.log('e', e);
    }

    console.log('a', a);
    console.log('a len', a.length);

    throw 'STOP';
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

    return answer.partial.itemDescription;
  }

  async writeCode(doc, sample, questions, itemDescription) {
    const chunks = this.chunks(doc);

    const context = {
      url: doc.url,
      html: chunks[0].html,
      text: chunks[0].text,
      itemDescription: itemDescription,
      sample: JSON.stringify(sample, null, 2),
      questions: JSON.stringify(questions, null, 2),
    };
    const prompt = codeGenMulti.render(context);

    console.log('prompt', prompt);

    console.log('writing code with', this.ai);

    logger.debug(`Writing code with ${this.ai}`);

    const start = (new Date()).getTime();
    const answer = await this.ai.ask(prompt, { format: 'text' });
    const took = (new Date()).getTime() - start;

    logger.debug(`Took ${(took / 1000).toFixed(1)} seconds to write code`);

    console.log('answer:', answer);

    const code = answer.partial
      .replace(/^```(javascript)?/, '')
      .replace(/```/g, '');
    console.log('code-->', code);
    // console.log('nodeHtmlParser', nodeHtmlParser);
    const fn = new Function('nodeHtmlParser', 'html', code);
    console.log('fn', fn);

    return (html) => fn(nodeHtmlParser, html);
  }

  async *run(target, questions, options) {
    const doc = await this.getDoc(target);

    console.log('doc:' + doc);
    console.log('helper:', this.helper);

    let sample = [];
    for await (const item of this.helper.stream(target, questions, options)) {
      delete item.url;
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

  }
}
