import OpenAILib from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
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
    const args = {
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      stream_options: { include_usage: true },
    };
    if (options.schema) {
      const toZod = (x) => {
        if (Array.isArray(x)) {
          const first = x.length == 0 ? '' : x[0];
          return z.array(toZod(first));
        } else if (typeof x == 'object') {
          const o = {};
          for (const key of Object.keys(x)) {
            o[key] = toZod(x[key]);
          }
          return z.object(o);
        } else if (typeof x == 'number') {
          return z.number();
        } else if (typeof x == 'integer') {
          return z.integer();
        } else if (typeof x == 'boolean') {
          return z.boolean();
        } else {
          // Fall back to string
          return z.string();
        }
      };

      args.response_format = zodResponseFormat(toZod(options.schema), 'item');
    }
    const completion = await openai.chat.completions.create(args);

    for await (const chunk of completion) {
      yield Promise.resolve(chunk);
    }
  }
}
