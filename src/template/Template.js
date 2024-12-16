import { hashObjectShort } from '../util';

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
    const hash = hashObjectShort({ prompt, systemPrompt, format, cacheHint, schema });
    const promptPart = prompt.replaceAll(/[^A-Za-z0-9]+/g, '-').substr(0, 32);
    return `ai-${this.constructor.name}-${this.model}-${promptPart}-${hash}`;
  }

  async renderMulti(context, flexField, ai, cache, timer) {
    const maxTokens = ai.maxTokens || 128000;

    let key;
    if (cache) {
      const hash = hashObjectShort({
        context,
        flexField,
        maxTokens,
        base: this.base,
      });
      key = `template-renderMulti-${this.constructor.name}-${hash}`;
      const cached = await cache.get(key);
      if (cached) return cached;
    }

    timer?.log('start');

    const barePrompt = this.render({ ...context, [flexField]: '' });
    const barePromptTokens = await ai.countTokens(barePrompt);

    timer?.log(`count bare prompt tokens, got ${barePromptTokens}`);

    const remainingTokens = (ai.maxTokens || 128000) - barePromptTokens;

    const prompts = [];
    for (let i = 0; i < context[flexField].length; i += remainingTokens) {
      const prompt = this.render({
        ...context,
        [flexField]: context[flexField].slice(i, i + remainingTokens),
      });
      prompts.push(prompt);
    }

    if (cache) cache.set(key, prompts);

    return prompts;
  }

  async renderCapped(context, flexField, ai, cache) {
    const maxTokens = ai.maxTokens || 128000;

    let key;
    if (cache) {
      const hash = hashObjectShort({
        context,
        flexField,
        maxTokens,
        base: this.base,
      });
      key = `template-renderCapped-${this.constructor.name}-${hash}`;
      const cached = await cache.get(key);
      if (cached) return cached;
    }

    const barePrompt = this.render({ ...context, [flexField]: '' });
    const barePromptTokens = await ai.countTokens(barePrompt);
    const remainingTokens = (ai.maxTokens || 128000) - barePromptTokens;

    const flexContent = context[flexField];

    const result = {
      prompt: this.render({
        ...context,
        [flexField]: context[flexField].slice(0, remainingTokens),
      }),
      bytesUsed: remainingTokens,
      done: remainingTokens >= flexContent.length,
    };

    if (cache) cache.set(key, result);

    return result;
  }
};
