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
    // const candidates = [];
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
    // console.log('PAGE====>', await page.content());
    logger.verbose(`Find ${this.query} matching ${this.selector} on ${this.page}`);

    const { candidates, map } = await this.label(this.page, this.selector);


    const maxBytes = this.ai.maxTokens / 2;
    const chunked = chunkList(candidates, maxBytes);
    let matches = [];
    let count = 0;

    for (let i = 0; i < chunked.length; i++) {
      const chunk = chunked[i];
      // console.log('chunk', chunk);
      const prompt = find.render({
        query: this.query,
        items: JSON.stringify(chunk, null, 2),
      });

      for await (const { delta } of this.ai.stream(prompt, { format: 'jsonl' })) {
        // console.log('map', map);
        // console.log('delta._ffid', delta._ffid);
        const r = map[delta._ffid];
        console.log('YIELD', r);
        yield Promise.resolve(r);
      }
    }
  }

  async first() {
    for await (const r of this.stream()) {
      return r;
    }
  }

  async all() {
    const results = [];
    for await (const r of this.stream()) {
      results.push(r);
    }
    return results;
  }
}
