import { getAi } from '../ai/index.js';
import { DefaultFetcher } from '../fetch/index.js';

export const BaseExtractor = class {
  constructor(ai, options) {
    const { fetcher, cache } = options || {};
    this.ai = getAi(ai, { cache });
    this.fetcher = fetcher || new DefaultFetcher({ cache });
  }

  async getDoc(target) {
    if (typeof target == 'string') {
      return await this.fetcher.fetch(target);
    } else {
      // Assume it is a doc
      return target;
    }
  }

  chunks(doc) {
    const maxTokens = this.ai.maxTokens;

    const textChunkSize = maxTokens * 4 * 0.1;
    const htmlChunkSize = maxTokens * 4 * 0.25;
    const text = doc.text || '';
    const html = doc.html || '';

    const result = [];

    for (let i = 0; ; i++) {
      const textPart = text.slice(
        i * textChunkSize,
        (i + 1) * textChunkSize);

      const htmlPart = html.slice(
        i * htmlChunkSize,
        (i + 1) * htmlChunkSize);

      if (!textPart && !htmlPart) break;

      result.push({
        offset: i,
        text: textPart,
        html: htmlPart,
      });
    }

    for (let i = 0; i < result.length; i++) {
      result[i].more = i + 1 < result.length;
    }

    return result;
  }

  countMissing(data, questions) {
    let c = 0;
    for (const q of questions) {
      if (!data[q] || data[q] == '(not found)') {
        c++
      }
    }
    return c;
  }
}
