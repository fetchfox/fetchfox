import { Mistral as MistralLib } from '@mistralai/mistralai';
import { BaseAI } from './BaseAI.js';
import { logger } from '../log/logger.js';
import { parseAnswer } from './util.js';

export const Mistral = class extends BaseAI {
  constructor(model, options) {
    const { apiKey, cache } = options || {};
    super(model, options);

    this.model = model || 'mistral-large-latest';
    this.apiKey = apiKey || process.env.MISTRAL_API_KEY;

    // TODO: Get max tokens for each model
    this.maxTokens = 128000;
  }

  normalizeChunk(chunk) {
    const { id, model } = chunk;

    let message;
    if (chunk.choices?.length) {
      const first = chunk.choices[0];
      if (first.message) {
        message = first.message.content;
      } else if (first.delta) {
        message = first.delta.content;
      }
    }

    let usage;
    if (chunk.usage) {
      usage = {
        input: chunk.usage.prompt_tokens,
        output: chunk.usage.completion_tokens,
        total: chunk.usage.prompt_tokens + chunk.usage.completion_tokens,
      };
    }

    return { id, model, message, usage };
  }

  async ask(prompt, options) {
    options = Object.assign({ format: 'text' }, options);
    const { format, cacheHint } = options;

    const cached = await this.getCache(prompt, options);
    if (cached) {
      return cached;
    }

    let usage = { input: 0, output: 0, total: 0 };
    let answer = '';
    let buffer = '';

    const client = new MistralLib({ apiKey: this.apiKey });
    const completion = await client.chat.complete({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
    });

    const ctx = { prompt, format, usage, answer, buffer, cacheHint };
    const chunk = completion;

    const result = this.parseChunk(this.normalizeChunk(chunk), ctx);
    this.setCache(prompt, options, result);
    return result;
  }

  async *stream(prompt, options) {
    const { format, cacheHint } = Object.assign({ format: 'text' }, options);

    const client = new MistralLib({ apiKey: this.apiKey });

    let usage = { input: 0, output: 0, total: 0 };
    let answer = '';
    let buffer = '';

    const completion = await client.chat.complete({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
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
