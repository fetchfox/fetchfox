import { logger } from '../log/logger.js';
import { Timer } from '../log/timer.js';

export const Template = class {
  constructor(args, base) {
    this.validate(args, base);
    this.base = base;
    this.args = args;

    // Reduce the bytes used by a percent as a safety buffer
    this.safetyMarginPercent = 0.6;

    // Optimization for renderCapped:
    // After counting tokens `memorySize` times, use the average
    // tokens per byte with a safety buffer, and use that. This
    // reduces expensive calls to count the tokens in a string,
    // and takes advantage of the fairly stable value of tokens
    // per byte for LLM's.

    // Keep track of latest token counts per byte
    this.memorySize = 16;
    this.bytesPerTokenMemory = [];

    // How often to sample after there is enough memory
    this.memorySampleRate = 0.1;
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

  async renderMulti(context, flexField, ai) {
    const copy = { ...context };
    const prompts = [];
    while (true) {
      const { prompt, bytesUsed, done } = await this.renderCapped(
        copy, flexField, ai);
      prompts.push(prompt);
      if (done) {
        break;
      }
      copy[flexField] = copy[flexField].substr(bytesUsed);
    }
    return prompts;
  }

  async renderCapped(context, flexField, ai) {
    await ai.init();

    const timer = new Timer();
    timer.push('Template.renderCapped');

    const maxTokens = (ai.maxTokens || 128000) * this.safetyMarginPercent;
    const countFn = async (str) => ai.countTokens(str, { timer });
    const accuracyTokens = Math.max(8000, maxTokens * 0.05);

    logger.debug(`${this} Memory=${this.bytesPerTokenMemory.length} target=${this.memorySize}`);

    // TODO: re-enable this

    // if (
    //   this.bytesPerTokenMemory.length >= this.memorySize &&
    //   Math.random() > this.memorySampleRate
    // ) {
    //   return this.renderCappedFromMemory(context, flexField, ai, { timer });
    // }

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

      const diff = maxTokens - tokens;
      logger.debug(`${this} Render capped got tokens=${tokens}, max=${maxTokens}, diff=${diff}`);

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

    this.bytesPerTokenMemory.push(bytesPerToken);
    if (this.bytesPerTokenMemory.length > this.memorySize) {
      this.bytesPerTokenMemory.shift();
    }

    return { prompt, bytesUsed, done: bytesUsed == len };
  }

  async renderCappedFromMemory(context, flexField, ai, options) {
    const timer = options?.timer || new Timer();
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
