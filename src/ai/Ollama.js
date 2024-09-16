import { Ollama as OllamaLib } from 'ollama'
import { logger } from '../log/logger.js';
import { BaseAI } from './BaseAI.js';
import { parseAnswer } from './util.js';

export const Ollama = class extends BaseAI {
  constructor(model, options) {
    super(model, options);
    const { host } = options || {};

    this.model = model || 'llama3.1';
    this.host = host || process.env.OLLAMA_HOST;

    console.log('using max tokens:', this.maxTokens);

    if (!this.maxTokens) {
      if (this.model.indexOf('llama3.1') != -1) {
        this.maxTokens = 128000;
      } else if (this.model.indexOf('codellama') != -1) {
        this.maxTokens = 128000;
      } else {
        // TODO: Find more context windows
        this.maxTokens = 10000;
      }
    }
  }

  normalizeChunk(chunk) {
    const { model } = chunk;

    const message = chunk.message?.content;

    let usage;
    const { prompt_eval_count, eval_count } = chunk;
    if (prompt_eval_count && eval_count) {
      usage = {
        input: prompt_eval_count,
        output: eval_count,
        total: prompt_eval_count + eval_count,
      };
    }

    return { model, message, usage };
  }

  async ask(prompt, options) {
    options = Object.assign({ format: 'text' }, options);
    const { format, cacheHint } = options;

    const cached = await this.getCache(prompt, options);
    if (cached) {
      return cached;
    }

    const ollama = new OllamaLib({ host: this.host });

    let usage = { input: 0, output: 0, total: 0 };
    let answer = '';
    let buffer = '';

    let completion;
    try {
      completion = await ollama.chat({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
      });
    } catch(e) {
      if (e.status_code == 524) return;
      throw e;
    }

    const ctx = { prompt, format, usage, answer, buffer, cacheHint };
    const chunk = completion;

    const result = this.parseChunk(this.normalizeChunk(chunk), ctx);

    this.setCache(prompt, options, result);

    return result;
  }

  async *stream(prompt, options) {
    const { format, cacheHint } = Object.assign({ format: 'text' }, options);

    let usage = { input: 0, output: 0, total: 0 };
    let answer = '';
    let buffer = '';

    const ollama = new OllamaLib({ host: this.host });

    const completion = await ollama.chat({
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
