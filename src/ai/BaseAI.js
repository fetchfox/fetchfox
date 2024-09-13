import crypto from 'crypto';
import { logger } from '../log/logger.js';

export const BaseAI = class {
  constructor(model, { apiKey, cache }) {
    if (cache) this.cache = cache;
    this.usage = { input: 0, output: 0, total: 0 };
  }

  toString() {
    return `[${this.constructor.name} ${this.model}]`;
  }

  cacheKey(prompt, { systemPrompt, format, cacheHint }) {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ prompt, systemPrompt, format, cacheHint }))
      .digest('hex')
      .substr(0, 16);
    const promptPart = prompt.replaceAll(/[^A-Za-z0-9]+/g, '-').substr(0, 32);
    return `ai-${this.constructor.name}-${this.model}-${promptPart}-${hash}`
  }

  async getCache(prompt, { systemPrompt, format, cacheHint }) {
    if (!this.cache) return;

    const key = this.cacheKey(prompt, { systemPrompt, format, cacheHint });
    const result = await this.cache.get(key);
    const outcome = result ? '(hit)' : '(miss)';
    logger.info(`Get prompt cache ${outcome} for ${key} for prompt "${prompt.substr(0, 32)}..."`);
    return result;
  }

  async setCache(prompt, { systemPrompt, format, cacheHint }, val) {
    if (!this.cache) return;

    const key = this.cacheKey(prompt, { systemPrompt, format, cacheHint });

    logger.info(`Set prompt cache for ${key} for prompt ${prompt.substr(0, 16)}... to ${(JSON.stringify(val) || '' + val).substr(0, 32)}..."`);
    return this.cache.set(key, val, 'prompt');
  }

  addUsage(usage) {
    for (const key in this.usage) {
      this.usage[key] += usage[key];
    }
  }

  gen(prompt, options) {
    if (options.stream) {
      return this.stream(prompt, { format: 'jsonl' });
    } else {
      const that = this;
      return (async function *() {
        const result = await that.ask(prompt, { format: 'jsonl' });
        if (!result?.delta) return;

        for (let r of result.delta) {
          yield Promise.resolve({
            delta: r,
            partial: result.partial,
            usage: result.usage,
          });
        }
      })();
    }
  }
}
