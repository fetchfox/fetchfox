import { logger } from '../log/logger.js';
import CryptoJS from 'crypto-js';
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
import { getAI } from '../ai/index.js';
import * as nodeHtmlParser from 'node-html-parser';

export const CodeGenExtractor = class extends BaseExtractor {
  constructor(options) {
    super(options);
    this.helper = getExtractor(options?.helper);
    this.ai = getAI('openai:gpt-4o');
    this.state = null;
  }

  async init(examples, questions) {
    if (this.state) {
      throw new Error('Double init');
    }

    this.state = {};

    this.state.examples = examples;
    this.state.questions = questions;
    this.state.feedback = { accuracy: 0 };
  }

  key(examples, questions) {
    const hash = CryptoJS
      .SHA256(JSON.stringify({ examples, questions }))
      .toString(CryptoJS.enc.Hex)
      .substr(0, 32);
    const key = 'cge_' + hash;
    return key;
  }

  async load(examples, questions) {
    if (this.state) {
      throw new Error('Double init via load');
    }

    const key = this.key(examples, questions);
    logger.info(`Load code gen state via key ${key}`);
    this.state = await this.kv.get(key);
  }

  async save() {
    if (!this.state) {
      throw new Error('No state to save');
    }
    const key = this.key(this.state.examples, this.state.questions);
    logger.info(`Save code gen state via key ${key}`);
    this.kv.set(key, this.state);
  }

  async learn(options) {
    const maxIterations = options?.maxIterations || 5;
    const junkAccuracy = options?.junkAccuracy || 40;
    const targetAccuracy = options?.targetAccuracy || 80
    const targetQuality = options?.targetQuality || 60;

    if (!this.state) {
      throw new Error('Need to init before learning');
    }

    const { questions } = this.state;

    // Use up to 3 examples
    const num = 3;

    const docs = await Promise.all(
      this.state.examples
        .slice(0, num)
        .map((example) => {
          return new Promise(async (ok) => {
            const gen = await this.getDoc(example);
            const doc = (await gen.next()).value;
            const removeTags = ['script', 'style', 'svg', 'meta', 'link'];
            const minDoc = new TagRemovingMinimizer(removeTags).min(doc);
            ok(minDoc);
          });
        }));

    logger.debug(`Getting sample for code generation`);
    const sampleSize = 5;
    const getSample = async (doc) => {
      const helperStream = this.helper.stream(doc, questions);
      const sample = [];
      for await (const item of helperStream)  {
        const copy = JSON.parse(JSON.stringify(item));
        if (copy.url) delete copy.url;
        sample.push(copy);
        if (sample.length >= sampleSize) break;
      }
      return sample;
    }

    const samples = await Promise.all(docs.map(getSample));

    const combinedSample = [];
    for (const sample of samples) {
      combinedSample.push(...sample);
    }

    const itemDescription = await this.findDescription(
      docs[0], samples[0], questions);
    logger.debug(`Got item description: ${itemDescription}`);

    logger.info(`Learn how to answer ${JSON.stringify(this.state.questions).substr(0, 100)} on ${JSON.stringify(this.state.examples)}`);

    let genFn = () => this.firstAttempt(docs, samples, questions);

    for (let i = 0; i < maxIterations; i++) {
      logger.info(`Code generation iteration ${i + 1} of ${maxIterations}, current best score is: ${this.state.feedback.accuracy}`);

      const candidate = await genFn();
      const actuals = [];
      for (const result of candidate.results) {
        actuals.push((result || []).slice(0, sampleSize));
      }

      const feedback = await this.feedback(
        docs,
        itemDescription,
        questions,
        candidate.code,
        samples,
        actuals);
      candidate.feedback = feedback;

      logger.debug(`Got feedback: ${JSON.stringify(feedback, null, 2)}`);

      if (feedback.accuracy < this.state.feedback.accuracy) {
        logger.debug(`Accuracy below previous best, throw away iteration`);
        continue;
      }

      if (feedback.accuracy <= junkAccuracy) {
        logger.debug(`Accuracy below threshold ${junkAccuracy}, start again on next iteration`);
        genFn = () => this.firstAttempt(docs, samples, questions);
        continue;
      }

      // Update our state to the candidate
      this.state.results = candidate.results;
      this.state.code = candidate.code;
      this.state.feedback = feedback;
      this.fn = candidate.fn

      logger.debug(`Check accuracy and quality: feedback=(${feedback.accuracy}, ${feedback.quality}), targets=(${targetAccuracy}, ${targetQuality})`);
      if (feedback.accuracy >= targetAccuracy && feedback.quality >= targetQuality) {
        logger.debug(`Hit targets, stop iteration`);
        break;
      }

      logger.debug(`Below targets, iterate and try again`);
      genFn = () => this.iterate(
        docs,
        itemDescription,
        questions,
        this.state.code,
        samples,
        actuals,
        feedback);
    }
  }

  async feedback(docs, itemDescription, questions, code, samples, actuals) {
    const [htmlsPrompt, samplesPrompt, actualsPrompt] = toPrompt(docs, samples, actuals);

    const context = {
      htmls: htmlsPrompt,
      samples: samplesPrompt,
      actuals: actualsPrompt,
      itemDescription,
      code,
      questions: JSON.stringify(questions, null, 2),
    };
    const prompt = codeGenFeedback.render(context);

    logger.debug(`Asking for feedback using ${this.ai}`);
    const start = (new Date()).getTime();
    const answer = await this.ai.ask(prompt, { format: 'json' });
    const took = (new Date()).getTime() - start;
    logger.debug(`Took ${(took / 1000).toFixed(1)} seconds to get feedback`);

    return answer.partial;
  }

  async iterate(docs, itemDescription, questions, code, samples, actuals, feedback) {
    const [htmlsPrompt, samplesPrompt, actualsPrompt] = toPrompt(docs, samples, actuals);

    const context = {
      htmls: htmlsPrompt,
      samples: samplesPrompt,
      actuals: actualsPrompt,
      itemDescription,
      code,
      questions: JSON.stringify(questions, null, 2),
      feedback: JSON.stringify(feedback, null, 2),
    };
    const prompt = codeGenIterate.render(context);

    logger.debug(`Iterating on code using ${this.ai}`);
    const start = (new Date()).getTime();
    const answer = await this.ai.ask(prompt, { format: 'text' });
    const took = (new Date()).getTime() - start;
    logger.debug(`Took ${(took / 1000).toFixed(1)} seconds to iterate on the code`);
    logger.debug(`Code iteration gave:\n${answer.partial}`);

    const out = codeToFn(answer.partial);

    const results = [];
    for (const doc of docs) {
      results.push(runFn(out.fn, doc.html));
    }
    return { fn: out.fn, results, code: out.code };
    // const results = runFn(out.fn, doc.html);
    return { fn: out.fn, results, code: out.code };
  }

  async firstAttempt(docs, samples, questions) {
    const itemDescription = await this.findDescription(docs[0], samples[0], questions);
    const { fn, code } = await this.writeCode(docs, samples, questions, itemDescription);
    const results = [];
    for (const doc of docs) {
      results.push(runFn(fn, doc.html));
    }
    return { fn, results, code };
  }

  async findDescription(doc, sample, questions) {
    const chunks = this.chunks(doc);
    const context = {
      url: '',
      html: chunks[0].html,
      text: chunks[0].text,
      sample: JSON.stringify(sample, null, 2),
      questions: JSON.stringify(questions, null, 2),
    };
    const prompt = findMultiDescription.render(context);
    const answer = await this.ai.ask(prompt, { format: 'json' });
    return answer.partial.itemDescription;
  }

  async writeCode(docs, samples, questions, itemDescription) {
    const [htmlsPrompt, samplesPrompt] = toPrompt(docs, samples);

    const context = {
      itemDescription: itemDescription,
      questions: JSON.stringify(questions, null, 2),
      num: docs.length,
      htmls: htmlsPrompt,
      samples: samplesPrompt,
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
    logger.warn(`AI generated code ran, but gave unusable reults: ${JSON.stringify(results || '').substr(0, 400)}`);
  } else {
    logger.debug(`Got results from AI generated code, first few: ${JSON.stringify(results.slice(0, 5), null, 2).substr(0, 1000)}`);
  }

  return results;
}

const toPrompt = (docs, samples, actuals) => {
  const tokensPerDoc = 30000;
  const bytesPerDoc = tokensPerDoc * 4;
  let h = '';
  let s = '';
  let a = ''
  for (let i = 0; i < docs.length; i++) {
    const html = docs[i].html.substr(0, bytesPerDoc);

    // TODO: prompt engineering: is it better to do HTML then the answers right after?
    h += `>>>> HTML sample #${i}:\n${html}\n\n\n`;
    const sample = JSON.stringify(samples[i], null, 2);
    s += `>>>> Correct answers for HTML sample #${i}:\n${sample}`;
    if (actuals) {
      const actual = JSON.stringify(actuals[i], null, 2);
      a += `>>>> The actual received answer for for HTML sample #${i}:\n${actual}`;
    }
  }
  return [h, s, a];
}
