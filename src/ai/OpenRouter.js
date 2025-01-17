import fetch from 'node-fetch';
import { OpenAI } from './OpenAI.js';
import { logger } from '../log/logger.js';

export const OpenRouter = class extends OpenAI {
  static apiKeyEnvVariable = 'OPENROUTER_API_KEY';
  static defaultModel = 'openai/gpt-4o-mini';

  constructor(options) {
    options.baseURL ||= 'https://openrouter.ai/api/v1';
    super(options);
  }

  async init() {
    if (this.didInit) {
      return;
    }

    let data;
    const key = 'openrouter-model-data-' + this.model;
    if (this.cache) {
      const cached = await this.cache.get(key);
      if (cached) {
        data = cached;
      }
    }

    if (!data) {
      const url = (await this.baseURL) + '/models';

      logger.debug(`${this} Calling ${url} to get model dat for ${this.model}`);

      const resp = await fetch(url);
      const jsonData = await resp.json();

      for (let item of jsonData.data) {
        if (item.id == this.model) {
          data = {
            ...item,
            max_input_tokens: item.context_length,
          };
        }
      }
    }

    if (!data) {
      logger.warn(`${this} Could not find model data in OpenRouter API: ${this.model}`);
      return;
    }

    if (this.cache) {
      this.cache.set(key, data).catch(() => {});
    }

    this.maxTokens ??= data.max_input_tokens;
    this.modelData = data;

    this.didInit = true;
  }
};
