import OpenAILib from 'openai';
import { logger } from '../log/logger.js';
import { parseAnswer } from './util.js';

export const OpenAI = class {
  constructor(apiKey, model) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    this.model = model || 'gpt-4o-mini';
  }

  async ask(prompt, cb, options) {
    const { systemPrompt } = options || {};

    const openai = new OpenAILib({
      apiKey: this.apiKey,
      dangerouslyAllowBrowser: true,
    });

    const stream = await openai.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      stream_options: { include_usage: true },
    });

    let answer = '';
    let usage = { input: 0, output: 0, total: 0 };
    for await (const chunk of stream) {
      if (chunk.usage) {
        usage.input = chunk.usage.prompt_tokens || 0; 
        usage.output = chunk.usage.completion_tokens || 0;
        usage.total = usage.input + usage.output;
      }

      if (chunk.choices?.length) {
        const delta = chunk.choices[0].delta.content;
        if (delta) {
          answer += delta;
          cb && cb({ answer, delta, usage });
        }
      }
    }

    logger.info(`AI raw answer: ${answer}`);
    logger.info(`AI usage was: ${JSON.stringify(usage)}`);

    return { answer: parseAnswer(answer), usage };
  }
}
