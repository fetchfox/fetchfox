import { logger } from '../log/logger.js';
import { Item } from '../item/Item.js';
import { BaseExtractor } from './BaseExtractor.js';
import { TagRemovingMinimizer } from '../min/TagRemovingMinimizer.js';
import {
  iterative,
  findMultiDescription,
  codeGenMulti,
  codeGenFeedback,
  codeGenIterate,
} from './prompts.js';
import { getExtractor } from './index.js';
import * as nodeHtmlParser from 'node-html-parser';

export const CodeGenExtractor = class extends BaseExtractor {
  constructor(options) {
    super(options);
    this.helper = getExtractor(options?.helper);

    this.state = null;
  }

  async init(target, questions) {
    if (this.state) {
      throw new Error('Double init');
    }

    this.state = {};

    this.state.target = target;
    this.state.questions = questions;
    this.state.feedback = { accuracy: 0 };
  }

  async learn(options) {
    const maxIterations = options?.maxIterations || 5;
    const junkAccuracy = options?.junkAccuracy || 40;
    const targetAccuracy = options?.targetAccuracy || 40;
    const targetQuality = options?.targetQuality || 60;

    if (!this.state) {
      throw new Error('Need to init before learning');
    }

    const { questions } = this.state;

    const gen = await this.getDoc(this.state.target);
    const doc = (await gen.next()).value;

    logger.debug(`Getting sample for code generation`);
    const helperStream = this.helper.stream(doc, questions);
    const sample = [];
    const sampleSize = 5;
    for await (const item of helperStream)  {
      const copy = JSON.parse(JSON.stringify(item));
      if (copy.url) delete copy.url;
      sample.push(copy);
      if (sample.length >= sampleSize) break;
    }

    const itemDescription = await this.findDescription(doc, sample, questions);
    logger.debug(`Got item description: ${itemDescription}`);

    logger.info(`Learn how to answer ${JSON.stringify(this.state.questions).substr(0, 100)} on ${this.state.target}`);

    const expected = sample;

    let genFn = () => this.firstAttempt(doc, sample, questions);

    for (let i = 0; i < maxIterations; i++) {
      logger.debug(`Code generation iteration ${i + 1} of ${maxIterations}, current best score is: ${this.state.feedback.accuracy}`);

      const candidate = await genFn(doc, sample, questions);
      const actual = (candidate.results || []).slice(0, expected.length);

      const feedback = await this.feedback(
        doc,
        itemDescription,
        questions,
        candidate.code,
        expected,
        actual);
      candidate.feedback = feedback;

      logger.debug(`Got feedback: ${JSON.stringify(feedback.accuracy, null, 2)}`);

      if (feedback.accuracy < this.state.feedback.accuracy) {
        logger.debug(`Accuracy below previous best, throw away iteration`);
        continue;
      }

      if (feedback.accuracy <= junkAccuracy) {
        logger.debug(`Accuracy below threshold ${junkAccuracy}, start again on next iteration`);
        genFn = () => this.firstAttempt(doc, sample, questions);
        continue;
      }

      // Update our state to the candidate
      this.state.results = candidate.results;
      this.state.code = candidate.code;
      this.state.feedback = feedback;
      this.fn = candidate.fn

      logger.debug(`Check accuracy and quality: feedback=${feedback.accuracy}, ${feedback.quality}, targets=${targetAccuracy}, ${targetQuality}`);
      if (feedback.accuracy >= targetAccuracy && feedback.quality >= targetQuality) {
        logger.debug(`Hit targets, stop iteration`);
        break;
      }

      logger.debug(`Below targets, iterate and try again`);
      genFn = () => this.iterate(
        doc,
        itemDescription,
        questions,
        this.state.code,
        expected,
        actual,
        feedback);
    }
  }

  async feedback(doc, itemDescription, questions, code, expected, actual) {
    const chunks = this.chunks(doc);
    const context = {
      html: chunks[0].html,
      itemDescription,
      code,
      expected: JSON.stringify(expected, null, 2),
      actual: JSON.stringify(actual, null, 2),
      questions: JSON.stringify(questions, null, 2),
    };
    const prompt = codeGenFeedback.render(context);

    logger.debug(`Asking for feedback using ${this.ai}`);
    const start = (new Date()).getTime();
    const answer = await this.ai.ask(prompt, { format: 'json' });
    const took = (new Date()).getTime() - start;
    logger.debug(`Took ${(took / 1000).toFixed(1)} seconds to get feedback`);
    logger.debug(`Feedback answer: ${answer.partial}`);

    return answer.partial;
  }

  async iterate(doc, itemDescription, questions, code, expected, actual, feedback) {
    const chunks = this.chunks(doc);
    const context = {
      html: chunks[0].html,
      itemDescription,
      code,
      expected: JSON.stringify(expected, null, 2),
      actual: JSON.stringify(actual, null, 2),
      questions: JSON.stringify(questions, null, 2),
      feedback: JSON.stringify(feedback, null, 2),
    };
    const prompt = codeGenIterate.render(context);

    logger.debug(`Iterating on code using ${this.ai}`);
    const start = (new Date()).getTime();
    const answer = await this.ai.ask(prompt, { format: 'text' });
    const took = (new Date()).getTime() - start;
    logger.debug(`Took ${(took / 1000).toFixed(1)} seconds to iterate on the code`);

    const out = codeToFn(answer.partial);
    const results = runFn(out.fn, doc.html);
    return { fn: out.fn, results, code: out.code };
  }

  async firstAttempt(doc, sample, questions) {
    const itemDescription = await this.findDescription(doc, sample, questions);
    const { fn, code } = await this.writeCode(doc, sample, questions, itemDescription);
    const results = runFn(fn, doc.html);
    return { fn, results, code };
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
    const minDoc = await (new TagRemovingMinimizer()).min(doc);
    const chunks = this.chunks(minDoc);

    const context = {
      url: doc.url,
      html: chunks[0].html,
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

    const { fn, code } = codeToFn(answer.partial);
    return { fn, code };
  }

  async *run(target, questions, options) {
    if (!this.state) {
      throw new Error('Code gen must learn a state before running');
    }

    if (JSON.stringify(questions) != JSON.stringify(this.state.questions)) {
      throw new Error(`Question mismatch in code gen run: ${JSON.stringify(questions)} != ${JSON.stringify(this.state.questions)}`);
    }

    const gen = await this.getDoc(target);
    const doc = (await gen.next()).value;

    const { fn } = codeToFn(this.state.code);
    const results = runFn(fn, doc.html);

    logger.info(`Returning ${results.length} results from code gen function`);
    for (const item of results) {
      yield Promise.resolve(item);
    }
  }
}

const codeToFn = (text) => {
  const code = text
    .replace(/^```(javascript)?/, '')
    .replace(/```/g, '');

  logger.debug(`AI wrote this code: ${code}`);

  let fn;
  try {
    fn = new Function('nodeHtmlParser', 'html', code);
  } catch(e) {
    logger.error(`Could not create function from code ${code}: ${e}`);
    return { fn: null, code };
  }

  const fnHtml = (html) => fn(nodeHtmlParser, html);

  logger.debug(`Returning function: ${fn}`);

  return { fn: fnHtml, code };
}

const runFn = (fn, html) => {
  let results;
  try {
    results = fn(html);
  } catch(e) {
    logger.error(`Could not run AI function: ${e}`);
    return;
  }

  if (!results || !Array.isArray(results) || results.length == 0) {
    logger.warn(`AI generated code ran, but gave unusable reults: ${JSON.stringify(results).substr(0, 400)}`);
  } else {
    logger.debug(`Got results from AI generated code, first few: ${JSON.stringify(results.slice(0, 5), null, 2).substr(0, 1000)}`);
  }

  return results;
}
