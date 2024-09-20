import * as cheerio from 'cheerio';
import pretty from 'pretty';
import { logger } from '../log/logger.js';
import { Document } from '../document/Document.js';
import { BaseMinimizer } from './BaseMinimizer.js';

export const TextOnlyMinimizer = class extends BaseMinimizer {
  constructor(options) {
    super(options);
  }

  async min(doc) {
    const cached = await this.getCache(doc, {});
    if (cached) return cached;

    const start = (new Date()).getTime() / 1000;
    const before = JSON.stringify([doc.html, doc.text]).length;
    logger.info(`Minimizing ${doc} with text only`);

    const data = doc.dump();
    data.body = '';
    data.html = '';

    const min = new Document();
    min.loadData(data);

    const after = JSON.stringify([min.html, min.text]).length;
    const took = (new Date()).getTime() / 1000 - start;
    logger.info(`Minimizing took ${took.toFixed(2)} seconds`);
    logger.info(`Minimized doc from ${before} bytes -> ${after} bytes`);

    this.setCache(doc, {}, min);

    return min;
  }
}
