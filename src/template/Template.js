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

    const allFound = args.every((arg) => found.includes(arg));
    const noExtra = found.every((arg) => args.includes(arg));

    if (!allFound) throw new Error(`Missing expected args. Expected: ${args}, Found: ${found}`);
    if (!noExtra) throw new Error(`Found extra args Expected: ${args}, Found: ${found}`);
  }

  render(context) {
    let prompt = this.base;
    for (const key of Object.keys(context)) {
      const val = context[key] || '';
      prompt = prompt.replaceAll('{{' + key + '}}', val);
    }
    return prompt;
  }

  cacheKey(prompt, { systemPrompt, format, cacheHint, schema }) {
    const hash = CryptoJS.SHA256(JSON.stringify({ prompt, systemPrompt, format, cacheHint, schema }))
      .toString(CryptoJS.enc.Hex)
      .substr(0, 16);
    const promptPart = prompt.replaceAll(/[^A-Za-z0-9]+/g, '-').substr(0, 32);
    return `ai-${this.constructor.name}-${this.model}-${promptPart}-${hash}`;
  }

  async renderMulti(context, flexField, ai, cache, timer) {
    timer?.log('start');
    const copy = { ...context };
    const prompts = [];
    let iter = 1;
    timer?.log('copy stuff');

    while (true) {
      timer?.push('renderCapped');
      const { prompt, bytesUsed, done } = await this.renderCapped(copy, flexField, ai, cache, timer);
      timer?.pop();

      prompts.push(prompt);
      copy[flexField] = copy[flexField].substr(bytesUsed);

      timer?.log(`iteration ${iter++}`);
      if (done) break;
    }

    timer?.log('iterations done');
    return prompts;
  }

  async renderCapped(context, flexField, ai, cache, timer) {
    const maxTokens = ai.maxTokens || 128000;
    const countFn = async (str) => ai.countTokens(str);
    const accuracy = 8000;

    let key;
    if (cache) {
      const hash = CryptoJS.SHA256(
        JSON.stringify({
          context,
          accuracy,
          flexField,
          maxTokens,
          base: this.base,
        }),
      )
        .toString(CryptoJS.enc.Hex)
        .substr(0, 16);
      key = `template-renderCapped-${this.constructor.name}-${hash}`;
      const cached = await cache.get(key);
      if (cached) return cached;
    }

    timer?.log('renderCapped - read cache');

    // see how many tokens the prompt takes up without flex field
    const promptWithoutFlexField = this.render({ ...context, [flexField]: '' });
    timer?.log(`renderCapped render prompt without flex field`);
    let tokens = await countFn(promptWithoutFlexField);

    timer?.log(`renderCapped count tokens, tokens = ${tokens}`);

    // incrementally encode the flex field until we hit desired # tokens
    let bytesUsed = 0;
    while (bytesUsed < context[flexField].length && tokens < maxTokens) {
      tokens += await countFn(context[flexField].slice(bytesUsed, bytesUsed + 10000));
      bytesUsed += 10000;
    }

    timer?.log('renderCapped - incrementally render flex field');

    // render final prompt with first `bytesUsed` chars of the flex field
    const prompt = this.render({
      ...context,
      [flexField]: context[flexField].slice(0, bytesUsed),
    });

    timer?.log(`renderCapped - render final prompt, used ${bytesUsed}/${context[flexField].length} bytes`);

    const result = { prompt, bytesUsed, done: bytesUsed >= context[flexField].length };
    if (cache) cache.set(key, result);

    timer?.log('renderCapped - produce result');

    return result;
  }
};
