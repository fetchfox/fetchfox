import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../log/logger.js';
import { BaseAI } from './BaseAI.js';
import { parseAnswer } from './util.js';

export const Gemini = class extends BaseAI {
  static apiKeyEnvVariable = 'GEMINI_API_KEY';
  static defaultModel = 'gemini-1.5-flash';

  constructor(options) {
    super(options);
  }

  async countTokens(str) {
    const gemini = new GoogleGenerativeAI(this.apiKey);
    const model = gemini.getGenerativeModel({ model: this.model });
    return model.countTokens(str);
  }

  normalizeChunk(chunk) {
    const message = chunk.text();
    let usage;

    if (chunk.usageMetadata) {
      usage = {
        input: chunk.usageMetadata.promptTokenCount,
        output: chunk.usageMetadata.totalTokenCount - chunk.usageMetadata.promptTokenCount,
        total: chunk.usageMetadata.totalTokenCount,
      };
    }

    return { model: this.model, message, usage };
  }

  async *inner(prompt, options) {
    options = Object.assign({ format: 'text' }, options);
    const gemini = new GoogleGenerativeAI(this.apiKey);
    const model = gemini.getGenerativeModel({ model: this.model });

    const completion = await model.generateContentStream(prompt);

    for await (const chunk of completion.stream) {
      yield Promise.resolve(chunk);
    }
  }
}
