import CryptoJS from 'crypto-js';
import { logger } from '../log/logger.js';

export const Template = class {
  constructor(args, base, cache) {
    this.validate(args, base);
    this.base = base;
    this.args = args;
    this.cache = cache;
  }

  validate(args, base) {
    const found = [];
    let m;
    const regex = /\{\{(\w+)\}\}/g;
    while ((m = regex.exec(base))) {
      found.push(m[1]);
    }

    const allFound = args.every(arg => found.includes(arg));
    const noExtra = found.every(arg => args.includes(arg));

    if (!allFound) throw new Error(`Missing expected args. Expected: ${args}, Found: ${found}`);
    if (!noExtra) throw new Error(`Found extra args Expected: ${args}, Found: ${found}`);
  }

  render(context) {
    let prompt = this.base;
    for (const key of Object.keys(context)) {
      const val = (context[key] || '');
      prompt = prompt.replaceAll('{{' + key + '}}', val);
    }
    return prompt;
  }

  cacheKey(prompt, { systemPrompt, format, cacheHint, schema }) {
    const hash = CryptoJS
      .SHA256(JSON.stringify({ prompt, systemPrompt, format, cacheHint, schema }))
      .toString(CryptoJS.enc.Hex)
      .substr(0, 16);
    const promptPart = prompt.replaceAll(/[^A-Za-z0-9]+/g, '-').substr(0, 32);
    return `ai-${this.constructor.name}-${this.model}-${promptPart}-${hash}`
  }

  async renderMulti(context, flexField, ai, cache) {
    const copy = { ...context };
    const prompts = [];
    const offset = 0;
    while (true) {
      const { prompt, bytesUsed, done } = await this.renderCapped(
        copy, flexField, ai, cache);
      prompts.push(prompt);
      if (done) {
        break;
      }
      copy[flexField] = copy[flexField].substr(bytesUsed);
    }
    return prompts;
  }

  async renderCapped(context, flexField, ai, cache) {
    const maxTokens = ai.maxTokens || 128000;
    const countFn = async (str) => ai.countTokens(str);
    const accuracy = 8000;

    let key;
    if (cache) {
      const hash = CryptoJS
        .SHA256(JSON.stringify({
          context,
          accuracy,
          flexField,
          maxTokens,
          base: this.base,
        }))
        .toString(CryptoJS.enc.Hex)
        .substr(0, 16);
      key = `template-renderCapped-${this.constructor.name}-${hash}`;
      const result = await cache.get(key);
      if (result) {
        return result;
      }
    }

    const start = (new Date()).getTime();

    let prompt;
    let tokens;
    let guess = Math.min(context[flexField].length, maxTokens * 4);
    let lowerBound = 0;
    let upperBound = Math.min(context[flexField].length, maxTokens * 8);

    const render = (size) => {
      const copy = { ...context };
      copy[flexField] = context[flexField].substr(0, size);
      return this.render(copy);
    }

    for (let i = 0; i < 10; i++) {
      prompt = render(guess);
      tokens = await countFn(prompt);

      if (tokens < maxTokens && maxTokens - tokens < accuracy) {
        lowerBound = guess;
        break;
      }

      if (tokens > maxTokens) {
        upperBound = guess;
      } else {
        lowerBound = guess;
      }

      guess = (lowerBound + upperBound) / 2;
    }

    const bytesUsed = lowerBound;
    prompt = render(bytesUsed);
    const final = await countFn(prompt);

    const took = (new Date()).getTime() - start;
    logger.debug(`Capped render took ${took} msec, gave ${final} tokens`);

    if (cache) {
      cache.set(key, prompt);
    }

    return { prompt, bytesUsed, done: bytesUsed == context[flexField].length };
  }
}
