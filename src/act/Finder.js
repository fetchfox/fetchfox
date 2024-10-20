import { logger } from '../log/logger.js';
import { getAI } from '../index.js';
import { chunkList } from '../util.js';
import { find } from './prompts.js';

export const Finder = class {
  constructor(options) {
    this.ai = options?.ai || getAI();
  }

  async find(page, query, selector) {
    console.log('FIND!', ''+page, query, selector);
    // console.log('PAGE====>', await page.content());
    logger.verbose(`Find ${query} matching ${selector} on ${page}`);

    const cssSelector = 'css=' + (selector || '*');
    const candidates = [];
    const loc = await page.locator(cssSelector);
    const map = {};
    let ffid = 1;
    for (const el of await loc.all()) {
      // console.log('el', el, await el.textContent(), await el.outerHTML());
      const _ffid = ffid++;
      const candidate = {
        _ffid,
        text: await el.textContent(),
        html: await el.evaluate((el, _ffid) => {
          el.setAttribute('ffid', _ffid);
          return el.outerHTML
        }, _ffid),
      };
      map[candidate._ffid] = el;
      candidates.push(candidate);
    }

    const maxBytes = this.ai.maxTokens / 2;
    const chunked = chunkList(candidates, maxBytes);
    let matches = [];
    let count = 0;

    const results = [];
    for (let i = 0; i < chunked.length; i++) {
      const chunk = chunked[i];
      const prompt = find.render({ query, items: JSON.stringify(chunk, null, 2) });
      for await (const { delta } of this.ai.stream(prompt, { format: 'jsonl' })) {
        results.push({ ffid: delta._ffid });
      }
    }
    return results;
  }
}
