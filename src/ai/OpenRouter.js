import { OpenAI } from './OpenAI.js';
import { getModelData } from './util.js';

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

    const parts = this.model.split('/');
    const data = await getModelData(parts[0], parts[1], this.cache);
    this.maxTokens = data.maxTokens;
    this.pricing = data.pricing;
    this.didInit = true;
  }
}
