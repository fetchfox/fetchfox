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
    console.log('normalizeChunk', chunk);
    const message = chunk.text();
    console.log('google said:', message);
    let usage;
    return { model: this.model, message, usage };
  }

  async *inner(prompt, options) {
    options = Object.assign({ format: 'text' }, options);
    const gemini = new GoogleGenerativeAI(this.apiKey);
    const model = gemini.getGenerativeModel({ model: this.model });

    const completion = await model.generateContentStream(prompt);
    console.log('gemini sreaming completion:', completion);

    for await (const chunk of completion.stream) {
      console.log('got a chunk from gemini', chunk);
      yield Promise.resolve(chunk);
    }
  }
}
