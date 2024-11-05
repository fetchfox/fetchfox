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
  }

  async attemptCodeGenForMulti(doc, sample, questions) {
    const itemDescription = await this.findDescription(doc, sample, questions);
    const fn = await this.writeCode(doc, sample, questions, itemDescription);

    let results;
    try {
      results = fn(doc.html);
    } catch(e) {
      logger.error(`Could not run AI function on ${doc}: ${e}`);
      return;
    }

    if (!results || !Array.isArray(results) || results.length == 0) {
      logger.warn(`AI generated code ran, but gave unusable reults: ${JSON.stringify(results).substr(0, 400)}`);
      return;
    }

    logger.debug(`Got results from AI generated code, first few: ${JSON.stringify(results.slice(0, 3), null, 2).substr(0, 1000)}`);

    return results;
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
    const answer = await this.ai.ask(prompt, { format: 'json' });
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

    logger.debug(`Writing code with ${this.ai}`);
    const start = (new Date()).getTime();
    const answer = await this.ai.ask(prompt, { format: 'text' });
    const took = (new Date()).getTime() - start;
    logger.debug(`Took ${(took / 1000).toFixed(1)} seconds to write code`);

    const code = answer.partial
      .replace(/^```(javascript)?/, '')
      .replace(/```/g, '');

    logger.debug(`AI wrote this code: ${code}`);

    let fn;
    try {
      fn = new Function('nodeHtmlParser', 'html', code);
    } catch(e) {
      logger.error(`Could not create function from code ${code}: ${e}`);
      return null;
    }

    const result = (html) => fn(nodeHtmlParser, html);

    logger.debug(`Returning function: ${result}`);

    return result;
  }

  async *run(target, questions, options) {
    const doc = await this.getDoc(target);

    if (options.single) {
      // For now, only write code for single page, multi item scrapes
      return this.helper.run(target, questions, options);
    }

    const helperStream = this.helper.stream(target, questions, options);

    let sample = [];
    const sampleSize = 5;

    for await (const item of helperStream)  {
      const copy = JSON.parse(JSON.stringify(item));
      sample.push(copy);
      if (sample.length >= sampleSize) break;
    }

    const codeResults = await this.attemptCodeGenForMulti(doc, sample, questions);
    if (codeResults) {
      for (const item of codeResults) {
        yield Promise.resolve(item);
      }
      return;
    }

    for (const item of sample) {
      yield Promise.resolve(item);
    }

    for await (const item of helperStream) {
      yield Promise.resolve(item);
    }
  }
}
