import { OpenAI } from './OpenAI.js';
import { getModelData } from './util.js';

export const OpenRouter = class extends OpenAI {
  static apiKeyEnvVariable = 'OPENROUTER_API_KEY';
  static defaultModel = 'openai/gpt-4o-mini';

  constructor(options) {
    options.baseURL ||= 'https://openrouter.ai/api/v1';
    super(options);
    const models = this.model.split(';');
    if (models.length > 1) {
        this.model = models[0];
        this.models = models.slice(1);
    }
  }

  async init() {
    if (this.didInit) {
      return;
    }

    // Get primary model information
    let parts = this.model.split('/');
    let data = await getModelData(parts[0], parts[1], this.cache);
    this.maxTokens = data.maxTokens;
    this.pricing = data.pricing;

    // Get fallback model information
    if (this.models) {
      for (fallbackModel of this.models) {
        parts = fallbackModel.split('/');
        data = await getModelData(parts[0], parts[1], this.cache);
        if (data.maxTokens < this.maxTokens) {
          this.maxTokens = data.maxTokens;
        }
      }
    }

    this.didInit = true;
  }
}
