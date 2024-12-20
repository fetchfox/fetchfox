import { Groq as GroqLib } from 'groq-sdk';
import { logger } from '../log/logger.js';
import { BaseAI } from './BaseAI.js';
import { parseAnswer } from './util.js';

export const Groq = class extends BaseAI {
  static apiKeyEnvVariable = 'GROQ_API_KEY';
  static defaultModel = 'llama3-8b-8192';

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

  async *inner(prompt, options) {
    const groq = new GroqLib({ apiKey: this.apiKey });
    const completion = await groq.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    for await (const chunk of completion) {
      yield Promise.resolve(chunk);
    }
  }
};
