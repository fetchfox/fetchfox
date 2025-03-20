import { Timer } from '../log/timer.js';

export const Template = class {
  constructor(args, base) {
    this.validate(args, base);
    this.base = base;
    this.args = args;

    // Reduce the bytes used by a percent as a safety buffer
    this.safetyMarginPercent = 0.6;
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

  async renderMulti(context, flexField, ai, options) {
    if (!context[flexField]) {
      throw new Error(`could not find flex field ${flexField} in context`);
    }

    const copy = { ...context };
    const prompts = [];
    while (true) {
      const { prompt, bytesUsed, done } = await this.renderCapped(
        copy, flexField, ai, options);
      prompts.push(prompt);
      if (done) {
        break;
      }
      copy[flexField] = copy[flexField].substr(bytesUsed);
    }
    return prompts;
  }

  async renderCapped(context, flexField, ai, options) {
    if (!context[flexField]) {
      throw new Error(`could not find flex field ${flexField} in context`);
    }

    await ai.init();

    const timer = new Timer();
    timer.push('Template.renderCapped');

    const maxTokens = (options?.maxTokens || ai.maxTokens || 128000) * this.safetyMarginPercent;
    const countFn = async (str) => ai.countTokens(str, { timer });
    const accuracyTokens = Math.max(8000, maxTokens * 0.05);

    const flexFields = Array.isArray(flexField) ? flexField : [flexField];

    let len = 0;
    const lens = {};
    for (const it of flexFields) {
      const l = (context[it] || '').length;
      lens[it] = l;
      len += l;
    }

    let prompt;
    let tokens;
    let guess = Math.min(len, maxTokens * 4);
    let lowerBound = 0;
    let upperBound = Math.min(len, maxTokens * 8);

    const render = (size) => {
      const copy = { ...context };
      const percent = size / len;
      for (const it of flexFields) {
        copy[it] = (context[it] || '').substr(0, lens[it] * percent);
      }
      return this.render(copy);
    }

    for (let i = 0; i < 10; i++) {
      prompt = render(guess);
      tokens = await countFn(prompt);

      const diff = maxTokens - tokens;

      if (tokens < maxTokens && (guess == len || diff < accuracyTokens)) {
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

    return { prompt, bytesUsed, done: bytesUsed == len };
  }

}
