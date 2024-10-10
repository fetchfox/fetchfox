import AnthropicLib from '@anthropic-ai/sdk';
import { logger } from '../log/logger.js';
import { BaseAI } from './BaseAI.js';
import { parseAnswer, sleep } from './util.js';

export const Anthropic = class extends BaseAI {
  constructor(model, options) {
    const { apiKey, cache } = options || {};
    model = model || 'claude-3-haiku-20240307';
    super(model, Object.assign(
      {},
      { maxRetries: 10, retryMsec: 10000 },
      options));

    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY;

    // Shouldn't need more than this, and Anthropic has a problem with stop tokens
    this.maxTokensOut = 8000;

    // This is lower than model max, but it is within their per-minute rate limit
    this.maxTokens = 80000;
  }

  normalizeChunk(chunk) {
    const { id, model } = chunk;

    let message;
    if (chunk.content) {
      const content = chunk.content[0];
      switch (content.type) {
        case 'text':
          message = content.text;
          break;
        default:
          throw 'Unhandled: ' + content.type;
      }
    }

    if (chunk.delta && chunk.type != 'message_delta') {
      const content = chunk.delta;
      switch (chunk.delta.type) {
        case 'text_delta':
          message = content.text;
          break;
        default:
          throw 'Unhandled: ' + chunk.delta.type;
      }
    }

    let usage;
    if (chunk.usage) {
      usage = {
        input: chunk.usage.input_tokens,
        output: chunk.usage.output_tokens,
        total: chunk.usage.input_tokens + chunk.usage.output_tokens,
      };
    }

    return { id, model, message, usage };
  }

  async *inner(prompt, options) {
    const anthropic = new AnthropicLib({ apiKey: this.apiKey });
    const completion = await anthropic.messages.create({
      max_tokens: this.maxTokensOut,
      messages: [{ role: 'user', content: prompt }],
      model: this.model,
      stream: true,
    });
    for await (const chunk of completion) {
      yield Promise.resolve(chunk);
    }
  }
}
