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

  async _min(doc) {
    logger.info(`Minimizing ${doc} with tag removing heuristics`);

    let initial = doc.html
      .replaceAll(/[ \t\n]+/g, ' ');  // remove whitespace

    const $ = cheerio.load(initial);
    for (const tag of this.removeTags) {
      $(tag).replaceWith(`[[${tag} removed]]`);
    }

    const removeAttributes = ['style'];
    for (const attribute of removeAttributes) {
      $('*').removeAttr(attribute); // Removes the attribute from all tags
    }

    const data = doc.dump();
    // const html = pretty($.html(), { ocd: true });
    const html = $.html();
    data.body = html;
    data.html = html;

    const min = new Document();
    min.loadData(data);

    min.parse();

    return min;
  }
}
