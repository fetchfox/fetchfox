import { Ollama as OllamaLib } from 'ollama';
import { logger } from '../log/logger.js';
import { BaseAI } from './BaseAI.js';
import { parseAnswer } from './util.js';

export const Ollama = class extends BaseAI {
  static apiKeyEnvVariable = 'OLLAMA_API_KEY';
  static optionalApiKey = true;
  static defaultModel = 'llama3.1';

  constructor(options) {
    super(options);
    this.host = options?.host || process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
    logger.info(`Using Ollama host ${this.host}`);

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
};
