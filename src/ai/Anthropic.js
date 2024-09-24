import AnthropicLib from '@anthropic-ai/sdk';
import { logger } from '../log/logger.js';
import { BaseAI } from './BaseAI.js';
import { parseAnswer, sleep } from './util.js';

export const Anthropic = class extends BaseAI {
  constructor(model, options) {
    const { apiKey, cache } = options || {};
    model = model || 'claude-3-haiku-20240307';
    super(model, Object.assign(
      {},
      { maxRetries: 10, retryMsec: 10000 },
      options));

    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY;

    // Shouldn't need more than this, and Anthropic has a problem with stop tokens
    this.maxTokensOut = 2000;

    // This is lower than model max, but it is within their per-minute rate limit
    this.maxTokens = 80000;
  }

  normalizeChunk(chunk) {
    const { id, model } = chunk;

    let message;
    if (chunk.content) {
      const content = chunk.content[0];
      switch (content.type) {
        case 'text':
          message = content.text;
          break;
        default:
          throw 'Unhandled: ' + content.type;
      }
    }

    if (chunk.delta && chunk.type != 'message_delta') {
      const content = chunk.delta;
      switch (chunk.delta.type) {
        case 'text_delta':
          message = content.text;
          break;
        default:
          throw 'Unhandled: ' + chunk.delta.type;
      }
    }

    let usage;
    if (chunk.usage) {
      usage = {
        input: chunk.usage.input_tokens,
        output: chunk.usage.output_tokens,
        total: chunk.usage.input_tokens + chunk.usage.output_tokens,
      };
    }

    return { id, model, message, usage };
  }

  async askInner(prompt, options) {
    const { format, cacheHint } = options || { format: 'text' };

    let usage = { input: 0, output: 0, total: 0 };
    let answer = '';
    let buffer = '';

    let completion;
    let retries = this.maxRetries;

    // TODO: pull out more abstractions info BaseAI, including the try/catch block here
    while (true) {
      try {
        const anthropic = new AnthropicLib({ apiKey: this.apiKey });
        completion = await anthropic.messages.create({
          max_tokens: this.maxTokensOut,
          messages: [{ role: 'user', content: prompt }],
          model: this.model,
        });

      } catch(e) {
        retries--;
        if (retries <= 0) throw e;

        logger.error(`Anthropic error: ${e}`);
        logger.info(`Caught Anthropic error, sleep for ${this.retryMsec} and try again. ${retries} tries left`);
        await sleep(this.retryMsec);
        continue;
      }

      break;
    }

    const ctx = { prompt, format, usage, answer, buffer, cacheHint };
    const chunk = completion;
    const result = this.parseChunk(this.normalizeChunk(chunk), ctx);

    return result;
  }

  async *stream(prompt, options) {
    const { format, cacheHint } = Object.assign({ format: 'text' }, options);

    const anthropic = new AnthropicLib({ apiKey: this.apiKey });

    let usage = { input: 0, output: 0, total: 0 };
    let answer = '';
    let buffer = '';

    const completion = await anthropic.messages.create({
      max_tokens: this.maxTokens,
      messages: [{ role: 'user', content: prompt }],
      model: this.model,
      stream: true,
    });

    const ctx = { prompt, format, usage, answer, buffer, cacheHint };
    for await (const chunk of completion) {
      const parsed = this.parseChunk(
        this.normalizeChunk(chunk),
        ctx);
      if (!parsed) continue;

      if (format == 'jsonl') {
        for (const d of parsed.delta) {
          yield Promise.resolve({
            delta: d,
            partial: parsed.partial,
            usage: parsed.usage });
        }
      } else {
        yield Promise.resolve(parsed);
      }
    }
  }
}
