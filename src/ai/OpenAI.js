import OpenAILib from 'openai';
import { BaseAI } from './BaseAI.js';
import { logger } from '../log/logger.js';
import { parseAnswer } from './util.js';

export const OpenAI = class extends BaseAI {
  constructor(model, options) {
    const { apiKey, cache } = options || {};
    model ||= 'gpt-4o';
    super(model, options);
    this.model = model;
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
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

  async *inner(prompt, options) {
    const openai = new OpenAILib({ apiKey: this.apiKey });
    const completion = await openai.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      stream_options: { include_usage: true },
    });

    for await (const chunk of completion) {
      yield Promise.resolve(chunk);
    }
  }
}
