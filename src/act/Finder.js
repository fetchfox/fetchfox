import { logger } from '../log/logger.js';
import { getAI } from '../ai/index.js';
import { chunkList } from '../util.js';
import { find } from './prompts.js';

export const Finder = class {
  constructor(ai, page, query, selector) {
    this.ai = ai;
    this.page = page;
    this.query = query;
    this.selector = selector;
  }

  async label(page, selector) {
    const cssSelector = 'css=' + (selector || '*');
    const loc = await page.locator(cssSelector);
    const map = {};
    let ffid = 1;

    const p = [];
    for (const el of await loc.all()) {
      const _ffid = ffid++;

      p.push(new Promise((ok) => {
        const candidate = { _ffid };
        map[_ffid] = el;

        return el.textContent()
          .then((text) => {
            candidate.text = text;
            return el.evaluate((el, _ffid) => {
              el.setAttribute('ffid', _ffid);
              return el.outerHTML;
            }, _ffid);
          })
          .then((html) => {
            candidate.html = html;
            ok(candidate);
          });
      }));
    }

    const candidates = await Promise.all(p);

    return { candidates, map };
  }

  async *stream() {
    logger.debug(`Find ${this.query} matching ${this.selector}`);
    const { candidates, map } = await this.label(this.page, this.selector);
    const maxBytes = this.ai.maxTokens / 2;
    const chunked = chunkList(candidates, maxBytes);
    let matches = [];
    let count = 0;

    for (let i = 0; i < chunked.length; i++) {
      const chunk = chunked[i];
      const prompt = find.render({
        query: this.query,
        items: JSON.stringify(chunk, null, 2),
      });

      for await (const { delta } of this.ai.stream(prompt, { format: 'jsonl' })) {
        logger.debug(`Found ffid=${delta._ffid}`);
        yield Promise.resolve(map[delta._ffid]);
      }
    }
  }

  async limit(l) {
    const results = [];
    for await (const r of this.stream()) {
      results.push(r);
      if (l && results.length >= l) break;
    }
    return results;
  }

  async first() {
    const results = await this.limit(1);
    return results?.length ? results[0] : null;
  }

  async all() {
    return this.limit();
  }
}
