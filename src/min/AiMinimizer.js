import { extract } from '@extractus/article-extractor';

import { logger } from '../log/logger.js';
import { getAi } from '../ai/index.js';
import { Document } from '../document/Document.js';
import { minimize } from './prompts.js';

export const AiMinimizer = class {
  constructor(ai, options) {
    this.ai = getAi(ai, options);
  }

  async min(doc, questions) {
    const start = (new Date()).getTime() / 1000;
    const before = JSON.stringify([doc.html]).length;
    logger.info(`Minimizing ${doc} with ${this.ai}`);

    const prompt = minimize.render({
      html: doc.html.substr(0, this.ai.maxTokens),
      questions,
    });
    const result = await this.ai.ask(prompt);
    const out = result.delta;
    const min = new Document();
    min.loadData(Object.assign(
      {},
      doc.dump(),
      {
        body: out,
        html: out,
        text: null,
      })
    );

    const took = (new Date()).getTime() / 1000 - start;
    const after = JSON.stringify([min.html]).length;
    logger.info(`Minimizing took ${took.toFixed(2)} seconds`);
    logger.info(`Minimized doc from ${before} bytes -> ${after} bytes`);

    return min;
  }
}
