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

  async *inner(prompt, options) {
    const ollama = new OllamaLib({ host: this.host });
    const completion = await ollama.chat({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    for await (const chunk of completion) {
      yield Promise.resolve(chunk);
    }
  }
}
