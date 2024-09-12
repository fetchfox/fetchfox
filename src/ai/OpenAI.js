import OpenAILib from 'openai';
import { BaseAI } from './BaseAI.js';
import { logger } from '../log/logger.js';
import { parseAnswer } from './util.js';

export const OpenAI = class extends BaseAI {
  constructor(model, { apiKey, cache }) {
    super(model, { apiKey, cache });

    this.model = model || 'gpt-4o-mini';
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;

    if (this.model.indexOf('gpt-3.5') != -1) {
      this.maxTokens = 16385;
    } else if (this.model.indexOf('gpt-4o-mini') != -1) {
      this.maxTokens = 128000;
    } else if (this.model.indexOf('gpt-4o') != -1) {
      this.maxTokens = 128000;
    } else if (this.model.indexOf('gpt-4') != -1) {
      this.maxTokens = 128000;
    } else {
      this.maxTokens = 10000;
    }
  }
  parseChunk(chunk, ctx) {
    if (chunk.usage) {
      const [input, output] = [
        chunk.usage.prompt_tokens || 0,
        chunk.usage.completion_tokens || 0];

      this.addUsage({
        input: input - ctx.usage.input,
        output: output - ctx.usage.output,
        total: input + output - ctx.usage.total });

      ctx.usage.input = input;
      ctx.usage.output = output;
      ctx.usage.total = input + output;
    }

    let delta;
    if (chunk.choices?.length) {
      const first = chunk.choices[0];
      if (first.message) {
        delta = first.message.content;
      } else if (first.delta) {
        delta = first.delta.content;
      }
    }

    if (delta) {
      ctx.answer += delta;

      const cache = () => {
        this.setCache(
          ctx.prompt,
          { format: ctx.format, cacheHint: ctx.cacheHint },
          { answer: parseAnswer(ctx.answer, ctx.format),
            usage: ctx.usage });
      }

      if (ctx.format == 'jsonl') {
        ctx.buffer += delta;
        const parsed = parseAnswer(ctx.buffer, ctx.format);
        if (parsed.length) {
          ctx.buffer = '';
          cache();
          return {
            delta: parsed,
            partial: parseAnswer(ctx.answer, ctx.format),
            usage: ctx.usage,
          };
        }
      } else {
        const parsed = parseAnswer(ctx.answer, ctx.format);
        cache();
        return {
          delta: parsed,
          partial: parseAnswer(ctx.answer, ctx.format),
          usage: ctx.usage,
        };
      }
    }
  }

  async ask(prompt, options, cb) {
    const { format, cacheHint } = Object.assign(
      { format: 'text' },
      options);

    // const cached = await this.getCache(prompt, { ...options, cacheHint });
    // if (cached) {
    //   if (format == 'jsonl') {
    //     const partial = [];
    //     for (const delta of cached.answer) {
    //       partial.push(delta);
    //       const result = { delta, partial, usage: cached.usage };
    //       return result;
    //     }
    //   } else {
    //     return cached;
    //   }
    // }

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
    return this.parseChunk(chunk, ctx);
  }

  async *stream(prompt, options) {
    const { format, cacheHint } = Object.assign({ format: 'text' }, options);

    // const cached = await this.getCache(prompt, { ...options, cacheHint });
    // if (cached) {
    //   if (format == 'jsonl') {
    //     const partial = [];
    //     for (const delta of cached.answer) {
    //       partial.push(delta);
    //       const result = { delta, partial, usage: cached.usage };
    //       return result;
    //     }
    //   } else {
    //     return cached;
    //   }
    // }

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

      const parsed = this.parseChunk(chunk, ctx);
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
