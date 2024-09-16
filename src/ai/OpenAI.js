import OpenAILib from 'openai';
import { BaseAI } from './BaseAI.js';
import { logger } from '../log/logger.js';
import { parseAnswer } from './util.js';

export const OpenAI = class extends BaseAI {
  constructor(model, options) {
    const { apiKey, cache } = options || {};
    super(model, options);

    this.model = model || 'gpt-4o-mini';
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;

    if (this.model.indexOf('gpt-3.5') != -1) {
      this.maxTokens = 16385;
    } else if (this.model.indexOf('gpt-4o-mini') != -1) {
      this.maxTokens = 128000;
    } else if (this.model.indexOf('gpt-4o') != -1) {
      this.maxTokens = 128000;
    } else if (this.model.indexOf('gpt-4-turbo') != -1) {
      this.maxTokens = 128000;
    } else if (this.model.indexOf('gpt-4') != -1) {
      this.maxTokens = 8192;
    } else {
      this.maxTokens = 10000;
    }
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
    if (cached) return cached;

    const openai = new OpenAILib({
      apiKey: this.apiKey,
      dangerouslyAllowBrowser: true,
    });

    let usage = { input: 0, output: 0, total: 0 };
    let answer = '';
    let buffer = '';

    const completion = await openai.chat.completions.create({
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

    const openai = new OpenAILib({
      apiKey: this.apiKey,
      dangerouslyAllowBrowser: true,
    });

    let usage = { input: 0, output: 0, total: 0 };
    let answer = '';
    let buffer = '';

    const completion = await openai.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      stream_options: { include_usage: true },
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
