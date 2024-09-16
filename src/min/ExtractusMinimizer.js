import { logger } from '../log/logger.js';
import { extract } from '@extractus/article-extractor';

import { Document } from '../document/Document.js';

export const ExtractusMinimizer = class {
  async min(doc) {
    const before = JSON.stringify([doc.html, doc.text]).length;
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

    logger.info(`Minimized doc from ${before} bytes -> ${after} bytes`);

    return min;
  }
}
