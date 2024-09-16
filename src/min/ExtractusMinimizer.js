import { logger } from '../log/logger.js';
import { extract } from '@extractus/article-extractor';

import { Document } from '../document/Document.js';

export const ExtractusMinimizer = class {
  constructor() {
  }

  async min(doc) {
    const start = (new Date()).getTime() / 1000;
    const before = JSON.stringify([doc.html, doc.text]).length;
    logger.info(`Minimizing ${doc} with extractus`);

    const article = await extract(doc.html);
    const out = JSON.stringify(article, null, 2);
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

    const after = JSON.stringify([min.html, min.text]).length;
    const took = (new Date()).getTime() / 1000 - start;
    logger.info(`Minimizing took ${took.toFixed(2)} seconds`);
    logger.info(`Minimized doc from ${before} bytes -> ${after} bytes`);

    return min;
  }
}
