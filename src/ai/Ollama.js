import { Ollama as OllamaLib } from 'ollama'
// import ollama from 'ollama'
import { logger } from '../log/logger.js';
import { BaseAI } from './BaseAI.js';
import { parseAnswer } from './util.js';

// { host: 'http://127.0.0.1:11434' }
const ollamaOptions = { host: 'https://compatible-corey-fetchfox-d0367ae7.koyeb.app' };

export const Ollama = class extends BaseAI {
  constructor(model, options) {
    const { apiKey, cache } = options || {};
    super(model, options);

    this.model = model || 'llama3.1';

    // TODO: Get actual model max tokens
    this.maxTokens = 5000;
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

    // const ollama = new OllamaLib({ host: 'http://127.0.0.1:11434' });
    const ollama = new OllamaLib(ollamaOptions);
    // console.log(prompt);

    let usage = { input: 0, output: 0, total: 0 };
    let answer = '';
    let buffer = '';

    const completion = await ollama.chat({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
    });

    const ctx = { prompt, format, usage, answer, buffer, cacheHint };
    const chunk = completion;

    // console.log('ollama chunk', chunk);

    const result = this.parseChunk(this.normalizeChunk(chunk), ctx);

    this.setCache(prompt, options, result);

    return result;
  }

  async *stream(prompt, options) {
    const { format, cacheHint } = Object.assign({ format: 'text' }, options);

    let usage = { input: 0, output: 0, total: 0 };
    let answer = '';
    let buffer = '';

    const ollama = new OllamaLib(ollamaOptions);

    const completion = await ollama.chat({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    // const completion = await anthropic.messages.create({
    //   max_tokens: this.maxTokens,
    //   messages: [{ role: 'user', content: prompt }],
    //   model: this.model,
    //   stream: true,
    // });

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
