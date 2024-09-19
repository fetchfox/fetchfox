import { Groq as GroqLib } from 'groq-sdk';
import { logger } from '../log/logger.js';
import { BaseAI } from './BaseAI.js';
import { parseAnswer } from './util.js';

export const Groq = class extends BaseAI {
  envVariable = 'GROQ_API_KEY';

  constructor(model, options) {
    model = model || 'llama3-8b-8192';
    super(model, options);
    const { apiKey } = options || {};
    this.apiKey = apiKey || process.env.GROQ_API_KEY;
  }

  normalizeChunk(chunk) {
    const { model } = chunk;

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

    return { model, message, usage };
  }

  async askInner(prompt, options) {
    options = Object.assign({ format: 'text' }, options);
    const { format, cacheHint } = options;

    const cached = await this.getCache(prompt, options);
    if (cached) {
      return cached;
    }

    // const ollama = new OllamaLib({ host: this.host });
    const groq = new GroqLib({ apiKey: this.apiKey });

    let usage = { input: 0, output: 0, total: 0 };
    let answer = '';
    let buffer = '';

    const completion = await groq.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
    });

    const ctx = { prompt, format, usage, answer, buffer, cacheHint };
    const chunk = completion;

    const result = this.parseChunk(this.normalizeChunk(chunk), ctx);

    return result;
  }

  async *stream(prompt, options) {
    const { format, cacheHint } = Object.assign({ format: 'text' }, options);

    let usage = { input: 0, output: 0, total: 0 };
    let answer = '';
    let buffer = '';

    // const ollama = new OllamaLib({ host: this.host });
    const groq = new GroqLib({ apiKey: this.apiKey });

    const completion = await groq.chat.completions.create({
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
