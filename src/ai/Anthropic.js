import { logger } from '../log/logger.js';
import AnthropicLib from '@anthropic-ai/sdk';
import { parseAnswer } from './util.js';

export const Anthropic = class {
  constructor(apiKey, model) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY;
    this.model = model || 'claude-3-5-sonnet-20240620';
  }

  async ask(prompt, cb, options) {
    const { systemPrompt, abort } = options || {};

    const anthropic = new AnthropicLib({
      apiKey: this.apiKey,
    });

    const stream = await anthropic.messages.create({
      max_tokens: 200000,
      messages: [{ role: 'user', content: prompt }],
      model: this.model,
      stream: true,
    });

    let didAbort = false;
    let answer = '';
    let usage = { input: 0, output: 0, total: 0 };
    for await (const chunk of stream) {
      let msgUsage = chunk.message?.usage || chunk.usage;
      if (msgUsage) {
        usage.input = msgUsage.input_tokens || 0;
        usage.output = msgUsage.output_tokens || 0;
        usage.total = usage.input + usage.output;
      }

      const delta = chunk.delta;
      if (delta?.type == 'text_delta') {
        answer += delta.text;
        cb && cb({ partial: parseAnswer(answer), delta, usage });
      }

      if (abort && abort()) {
        logger.info(`Got abort signal`);
        didAbort = true;
        break;
      }
    }

    logger.info(`AI raw answer: ${answer}`);
    logger.info(`AI usage was: ${JSON.stringify(usage)}`);

    return {
      answer: parseAnswer(answer),
      usage,
      didAbort,
    };
  }
}
