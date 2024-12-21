import CryptoJS from 'crypto-js';
import { logger } from '../log/logger.js';
import { timer } from '../log/timer.js';

export const Template = class {
  constructor(args, base, cache) {
    this.validate(args, base);
    this.base = base;
    this.args = args;
    this.cache = cache;

    // * Optimization for renderCapped:
    // After counting tokens `memorySize` times, use the average
    // tokens per byte with a safety buffer, and use that. This
    // reduces expensive calls to count the tokens in a string,
    // and takes advantage of the fairly stable value of tokens
    // per byte for LLM's.

    // Keep track of latest token counts per byte
    this.memorySize = 4;
    this.bytesPerTokenMemory = [];

    // Reduce the bytes used by a percent as a safety buffer
    this.safetyMarginPercent = 0.8;

    // How often to sample after there is enough memory
    this.memorySampleRate = 0.05;
  }

  toString() {
    return '[Template]';
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
    return `ai-${this.constructor.name}-${this.model}-${promptPart}-${hash}`;
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
    const accuracyBytes = 16000;

    let key;
    if (cache) {
      const hash = CryptoJS
        .SHA256(JSON.stringify({
          context,
          accuracyBytes,
          flexField,
          maxTokens,
          base: this.base,
        }))
        .toString(CryptoJS.enc.Hex)
        .substr(0, 16);
      key = `template-renderCapped-${this.constructor.name}-${hash}`;
      const cached = await cache.get(key);
      if (cached) {
        return cached;
      }
    }

    if (
      this.bytesPerTokenMemory.length >= this.memorySize &&
      Math.random() > this.memorySampleRate
    )
    {
      const prompt = this.renderCappedFromMemory(context, flexField, ai);
      if (prompt) {
        return prompt;
      }
    }

    timer.push('Template.renderCapped');

    const len = context[flexField].length;

    let prompt;
    let tokens;
    let guess = Math.min(len, maxTokens * 4);
    let lowerBound = 0;
    let upperBound = Math.min(len, maxTokens * 8);

    const render = (size) => {
      const copy = { ...context };
      copy[flexField] = context[flexField].substr(0, size);
      return this.render(copy);
    }

    for (let i = 0; i < 10; i++) {
      prompt = render(guess);
      tokens = await countFn(prompt);

      if (tokens < maxTokens &&
        (guess == len || len - guess < accuracyBytes))
      {
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

    const bytesPerToken = bytesUsed / final;

    timer.log(`bytes per token=${bytesPerToken.toFixed(2)}`);
    timer.pop();

    this.bytesPerTokenMemory.push(bytesPerToken);
    if (this.bytesPerTokenMemory.length > this.memorySize) {
      this.bytesPerTokenMemory.shift();
    }

    const result = { prompt, bytesUsed, done: bytesUsed == len };
    if (cache) {
      cache.set(key, result);
    }
    return result;
  }

  async renderCappedFromMemory(context, flexField, ai) {
    timer.push('Template.renderCappedFromMemory');

    const maxTokens = ai.maxTokens || 128000;

    const sum = this.bytesPerTokenMemory.reduce((acc, x) => acc + x, 0);
    const bytesPerTokenAvg = sum / this.bytesPerTokenMemory.length;

    if (!bytesPerTokenAvg) {
      return;
    }

    logger.debug(`${this} Rendering from memory with bytes per token=${bytesPerTokenAvg.toFixed(2)}`);

    const render = (size) => {
      const copy = { ...context };
      copy[flexField] = context[flexField].substr(0, size);
      return this.render(copy);
    }

    const emptyTokens = render(0).length / bytesPerTokenAvg;

    if (emptyTokens > maxTokens) {
      throw new Error('Prompt without context likely larger than max tokens');
    }

    const availableTokens = (maxTokens - emptyTokens) * this.safetyMarginPercent;
    const len = context[flexField].length;
    const bytes = Math.min(len, availableTokens * bytesPerTokenAvg);
    const final = render(bytes);

    timer.pop();

    logger.debug(`${this} Rendered from memory, got ${final.length} bytes`);

    return { prompt: final, bytesUsed: bytes, done: bytes == len };
  }
}
