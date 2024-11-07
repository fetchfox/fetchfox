import { extract } from '@extractus/article-extractor';
import { logger } from '../log/logger.js';
import { Document } from '../document/Document.js';
import { BaseMinimizer } from './BaseMinimizer.js';

export const ExtractusMinimizer = class extends BaseMinimizer {
  constructor(options) {
    super(options);
  }

  async min(doc) {
    const options = { removeTags: this.removeTags }
    const cached = await this.getCache(doc, options);
    if (cached) return cached;
    if (!doc) return;

    const start = (new Date()).getTime() / 1000;
    const before = JSON.stringify([doc.html, doc.text]).length;
    logger.info(`Minimizing ${doc} with extractus`);

    const article = await extract(doc.html);
    const out = JSON.stringify(article, null, 2);
    const min = new Document();
    await min.loadData(Object.assign(
      {},
      await doc.dump(),
      {
        body: out,
        html: out,
        text: null,
      })
    );

    const after = JSON.stringify([min.html, min.text]).length;
    const took = (new Date()).getTime() / 1000 - start;
    logger.info(`Minimizing took ${took.toFixed(2)} seconds`);
    logger.info(`Minimized doc from ${before} bytes -> ${after} bytes`);

    this.setCache(doc, options, min);

    return min;
  }
}
