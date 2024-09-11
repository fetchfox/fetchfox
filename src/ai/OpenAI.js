import OpenAILib from 'openai';
import { BaseAI } from './BaseAI.js';
import { logger } from '../log/logger.js';
import { parseAnswer } from './util.js';

export const OpenAI = class extends BaseAI {
  constructor(model, { apiKey, cache }) {
    super(model, { apiKey, cache });

    this.model = model || 'gpt-4o-mini';
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;

    if (this.model.indexOf('gpt-3.5') != -1) {
      this.maxTokens = 16385;
    } else if (this.model.indexOf('gpt-4o-mini') != -1) {
      this.maxTokens = 128000;
    } else if (this.model.indexOf('gpt-4o') != -1) {
      this.maxTokens = 128000;
    } else if (this.model.indexOf('gpt-4') != -1) {
      this.maxTokens = 128000;
    } else {
      this.maxTokens = 10000;
    }
  }

  async *stream(prompt, options) {
    const { systemPrompt, format, cacheHint } = Object.assign(
      { format: 'text' }, options);

    const cached = await this.getCache(prompt, { ...options, cacheHint });
    if (cached) {
      if (format == 'jsonl') {
        const partial = [];
        for (const delta of cached.answer) {
          partial.push(delta);
          const result = { delta, partial, usage: cached.usage };
          yield Promise.resolve(result);
        }
      } else {
        yield Promise.resolve(cached);
      }
      return;
    }

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

    let usage = { input: 0, output: 0, total: 0 };
    let answer = '';
    let buffer = '';

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

          const cache = () => {
            // TODO: properly handle stream cancellations
            this.setCache(
              prompt,
              { ...options, cacheHint },
              { answer: parseAnswer(answer, format), usage });
          }

          if (format == 'jsonl') {
            buffer += delta;
            const parsed = parseAnswer(buffer, format);
            if (parsed.length) {
              for (const result of parsed) {
                cache();
                yield Promise.resolve({
                  delta: result,
                  partial: parseAnswer(answer, format),
                  usage });
              }
              buffer = '';
            }
          } else {
            const parsed = parseAnswer(answer, format);
            cache();
            yield Promise.resolve({
              delta: parsed,
              partial: parseAnswer(answer, format),
              usage });
          }
        }
      }
    }
  }

  async ask(prompt, cb, options) {
    const { systemPrompt, abort } = options || {};

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

    let didAbort = false;
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
          cb && cb({ partial: parseAnswer(answer), delta, usage });
        }
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
