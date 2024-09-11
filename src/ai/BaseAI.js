import crypto from 'crypto';
import { logger } from '../log/logger.js';

export const BaseAI = class {
  constructor(model, { apiKey, cache }) {
    if (cache) this.cache = cache;
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
    logger.info(`Get prompt cache for ${key} for prompt "${prompt.substr(0, 32)}..."`);
    return await this.cache.get(key);
  }

  async setCache(prompt, { systemPrompt, format, cacheHint }, val) {
    if (!this.cache) return;

    const key = this.cacheKey(prompt, { systemPrompt, format, cacheHint });
    logger.info(`Set prompt cache for ${key} for prompt ${prompt.substr(0, 16)}... to ${JSON.stringify(val).substr(0, 32)}..."`);
    return this.cache.set(key, val, 24 * 3600);
  }
}
