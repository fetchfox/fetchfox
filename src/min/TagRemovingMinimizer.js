import * as cheerio from 'cheerio';
import pretty from 'pretty';
import { logger } from '../log/logger.js';
import { Document } from '../document/Document.js';
import { BaseMinimizer } from './BaseMinimizer.js';

export const TagRemovingMinimizer = class extends BaseMinimizer {
  constructor(options) {
    super(options);
    this.removeTags = (options || {}).removeTags || ['script', 'style', 'svg'];
  }

  async min(doc) {
    const options = { removeTags: this.removeTags }
    const cached = await this.getCache(doc, options);
    if (cached) return cached;

    const start = (new Date()).getTime() / 1000;
    const before = JSON.stringify([doc.html, doc.text]).length;
    logger.info(`Minimizing ${doc} with tag removing heuristics`);

    let initial = doc.html
      .replaceAll(/[ \t\n]+/g, ' ');  // remove whitespace

    const $ = cheerio.load(initial);
    for (const tag of this.removeTags) {
      $(tag).replaceWith(`[[${tag} removed]]`);
    }
    const data = doc.dump();
    const html = $.html();
    data.body = html;
    data.html = html;

    const min = new Document();
    min.loadData(data);

    min.parse();

    const after = JSON.stringify([min.html, min.text]).length;
    const took = (new Date()).getTime() / 1000 - start;
    logger.info(`Minimizing took ${took.toFixed(2)} seconds`);
    logger.info(`Minimized doc from ${before} bytes -> ${after} bytes`);

    this.setCache(doc, options, min);

    return min;
  }
}
