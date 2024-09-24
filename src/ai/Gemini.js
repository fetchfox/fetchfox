// import { Groq as GroqLib } from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../log/logger.js';
import { BaseAI } from './BaseAI.js';
import { parseAnswer } from './util.js';

export const Gemini = class extends BaseAI {
  constructor(model, options) {
    model = model || 'gemini-1.5-flash';
    super(model, options);
    const { apiKey } = options || {};
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
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

  async askInner(prompt, options) {
    options = Object.assign({ format: 'text' }, options);
    const { format, cacheHint } = options;

    const cached = await this.getCache(prompt, options);
    if (cached) {
      return cached;
    }

    const gemini = new GoogleGenerativeAI(this.apiKey);
    const model = gemini.getGenerativeModel({ model: this.model });

    let usage = { input: 0, output: 0, total: 0 };
    let answer = '';
    let buffer = '';

    const completion = await model.generateContent([ prompt ]);
    const ctx = { prompt, format, usage, answer, buffer, cacheHint };
    const chunk = completion;
    const result = this.parseChunk(this.normalizeChunk(chunk), ctx);

    return result;
  }

  async *stream(prompt, options) {
    throw 'Streaming unavailable for Gemini';
  }
}
