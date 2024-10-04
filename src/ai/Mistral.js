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
        input: chunk.usage.promptTokens,
        output: chunk.usage.completionTokens,
        total: chunk.usage.promptTokens + chunk.usage.completionTokens,
      };
    }

    return { id, model, message, usage };
  }

  async *inner(prompt, options) {
    const client = new MistralLib({ apiKey: this.apiKey });
    const completion = await client.chat.complete({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    for await (const chunk of completion) {
      yield Promise.resolve(chunk);
    }
  }
}
