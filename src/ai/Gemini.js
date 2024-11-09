// import { Groq as GroqLib } from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../log/logger.js';
import { BaseAI } from './BaseAI.js';
import { parseAnswer } from './util.js';

export const Gemini = class extends BaseAI {
  static apiKeyEnvVariable = 'GEMINI_API_KEY';
  static defaultModel = 'gemini-1.5-flash';

  constructor(options) {
    super(options);

    if (this.model.indexOf('flash') != -1) {
      // Cap tokens at 128k to receive lower pricing tier
      // https://ai.google.dev/pricing
      this.maxTokens = 128000;
    }
  }

  normalizeChunk(chunk) {
    let message;
    if (chunk.response?.candidates &&
      chunk.response.candidates[0].content?.parts) {

      message = chunk.response.candidates[0].content.parts[0].text;
    }

    let usage;
    if (chunk.response?.usageMetadata) {
      usage = {
        input: chunk.response.usageMetadata.promptTokenCount || 0,
        output: chunk.response.usageMetadata.candidatesTokenCount || 0,
        total: ((chunk.response.usageMetadata.promptTokenCount || 0) +
                (chunk.response.usageMetadata.candidatesTokenCount || 0)),
      };
    }

    return { model: this.model, message, usage };
  }

  async *inner(prompt, options) {
    // TODO: Implement Gemini streaming

    options = Object.assign({ format: 'text' }, options);
    const gemini = new GoogleGenerativeAI(this.apiKey);
    const model = gemini.getGenerativeModel({ model: this.model });
    const completion = await model.generateContent([ prompt ]);

    // const ctx = { prompt, format, usage, answer, buffer, cacheHint };

    const chunk = await completion;
    return yield Promise.resolve(chunk);
  }
}
