import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAI } from './BaseAI.js';

export const Gemini = class extends BaseAI {
  static apiKeyEnvVariable = 'GEMINI_API_KEY';
  static defaultModel = 'gemini-1.5-flash';

  constructor(options) {
    super(options);
  }

  async countTokens(str) {
    // For now, just give a quick estimate. Actually counting the tokens
    // is too slow for prod
    return str.length / 2;


    // const gemini = new GoogleGenerativeAI(this.apiKey);
    // const model = gemini.getGenerativeModel({ model: this.model });
    // const ct = await model.countTokens(str);
    // return ct.totalTokens;
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
    const gemini = new GoogleGenerativeAI(this.apiKey);

    const generationConfig = {};
    if (options?.temperature) {
      generationConfig.temperature = options.temperature;
    }
    if (options?.topP) {
      generationConfig.topP = options.topP;
    }

    const systemPrompt = 'Act as a web scraping assistant, adept at understanding HTML and CSS and producing structured output.  You will help navigate a page by identifying and selecting relevant elements to click , particularly for accepting cookies and reaching the next page of content.  Never try to select an element that that does not exist.';

    const model = gemini.getGenerativeModel({ model: this.model, systemInstruction: systemPrompt, generationConfig });

    const completion = await model.generateContentStream(prompt);

    for await (const chunk of completion.stream) {
      yield Promise.resolve(chunk);
    }
  }
}
