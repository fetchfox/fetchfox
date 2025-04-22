import pretty from 'pretty';
import { shortObjHash } from '../util.js';
import { transform } from './transform.js';
import { BaseTransformer } from './BaseTransformer.js';
import { DropTransformer } from './DropTransformer.js';
import { TagsTransformer } from './TagsTransformer.js';
import * as prompts from './prompts.js';
import { parse } from 'node-html-parser';

const unique = (l) => {
  const u = [];
  const seen = {};
  for (const it of l) {
    const ser = JSON.stringify(it);
    if (seen[ser]) continue;
    seen[ser] = true;
    u.push(it);
  }
  return u;
}

export const SelectorTransformer = class extends BaseTransformer {
  constructor(template, options) {
    super(options);
    this.template = template;
  }

  key(url) {
    const u = new URL(url);
    const format = u.origin + u.pathname.replace(/[^/]+/g, '*');
    const hash = shortObjHash({ template: this.template });
    return `select-transform-${format}-${hash}`;
  }

  async _transform(html, url) {
    const key = this.key(url);
    const saved = await this.kv.get(key);

    let selectors;
    let meta;
    if (saved) {
      this.logger.debug(`${this} Found saved selectors from ${key}: ${saved}`);
      const data = JSON.parse(saved);
      selector = data.selector;
      meta = data.meta;
    } else {
      const r = await this._learn(html);
      selectors = r?.selectors;
      meta = r?.meta;
    }

    this.logger.info(`${this} Got selectors for ${key}: ${JSON.stringify(selectors)}`);

    if (!selectors) {
      this.logger.debug(`${this} Couldn't find any selectors`);
      return;
    }

    await this.kv.set(key, JSON.stringify({ selectors }));

    const root = parse(html);
    const keep = {};

    console.log('==>selectors', selectors);

    for (const selector of selectors) {
      console.log('selector', selector);
      for (const el of root.querySelectorAll(selector)) {
        const hash = shortObjHash({ h: el.outerHTML });
        keep[hash] = true;
      }
    }

    const prune = (node) => {
      const hash = shortObjHash({ h: node.outerHTML });
      if (keep[hash]) {
        return node.outerHTML;
      }

      const childHtmls = [];
      for (const child of (node?.childNodes || [])) {
        const html = prune(child);
        if (html) {
          childHtmls.push(html);
        }
      }

      if (!childHtmls.length) {
        return null;
      } if (childHtmls.length == 1) {
        return childHtmls[0];
      } else {
        return `<div>` + childHtmls.join('\n') + '</div>';
      }
    }

    const out = prune(root);
    console.log('out', pretty(out, { ocd: true }));

    return { html: out, selectors }
  }

  async _learn(html) {
    const out = await transform(
      html,
      [
        new TagsTransformer(),
        new DropTransformer({ limit: 32 }),
      ]);
    html = out.html;

    // const root = parse(html);

    const context = {
      html: pretty(html, { ocd: true }),
      template: JSON.stringify(this.template, null, 2),
    };

    const { prompt }  = await prompts.selectors.renderCapped(
      context, 'html', this.ai.advanced);

    const answer = await this.ai.advanced.ask(prompt, { format: 'json' });
    console.log('answer', answer.partial);

    const map = { ...answer.partial, _reasoning: null };
    const selectors = Object.values(map).filter(Boolean);

    return { selectors };

    // const cssPrompts = await prompts.learnCSS2
    //   .renderMulti(context, 'html', this.ai.advanced);

    // const answers = (
    //   await Promise.allSettled(cssPrompts.map(
    //     (prompt) => this.ai.advanced.ask(prompt, { format: 'json' })
    //   ))
    // )
    //   .filter(it => it.status == 'fulfilled')
    //   .map(it => it.value)
    //   .sort((a, b) => b.rating - a.rating);

    // console.log('answers', JSON.stringify(answers, null, 2));

    // let missing = Object.keys(this.template);
    // const selectors = [];

    // console.log('==>');

    // for (const answer of answers) {
    //   console.log('answer', answer);
    //   for (const cand of answer.partial) {
    //     const selector = cand.selector;
    //     const covered = cand.fieldsCovered;
    //     const intersection = covered.filter(it => missing.includes(it));

    //     console.log('it ->', selector, intersection);

    //     if (intersection.length) {
    //       selectors.push(selector);
    //     }

    //     missing = missing.filter(it => !covered.includes(it));

    //     console.log('missing is now', missing);
    //   }
    // }

    // console.log('sels', selectors);

    // const parentContext = { ...context, selectors };
    // const { prompt: parentPrompt } = await prompts.parentCSS
    //   .renderCapped(parentContext, 'html', this.ai.advanced);
    // const answer = await this.ai.advanced.ask(parentPrompt, { format: 'json' });
    // console.log('parent answer', answer.partial);

    // throw 'stop444';

    // return { selectors };

    // throw 'STOP3';

    // const candidates = [];
    // const map = {};
    // for (const answer of answers) {
    //   const group = [];
    //   for (const it of (answer?.partial || [])) {
    //     this.logger.debug(`${this} Got selector candidate: ${JSON.stringify(it, null, 2)}`);
    //     if (!it.selector) {
    //       continue;
    //     }
    //     group.push(it);
    //     map[it.selector] = it;
    //   }
    //   candidates.push(group);
    // }

    // this.logger.debug(`${this} Selectors map: ${JSON.stringify(map, null, 2)}`);

    // const grouped = {};
    // for (const group of candidates) {
    //   const hashes = [];
    //   let count = 0;
    //   for (const c of group) {
    //     const matches = root.querySelectorAll(c.selector);
    //     this.logger.debug(`${this} Found ${matches.length} matches for ${c.selector}`);
    //     for (const node of matches) {
    //       const h = shortObjHash({ html: node.innerHTML });
    //       hashes.push(h);
    //       count++;
    //     }
    //   }
    //   hashes.sort();
    //   const hash = shortObjHash({ hashes });
    //   grouped[hash] ||= {
    //     selectors: [],
    //     rating: 0,
    //     matches: 0,
    //   };

    //   grouped[hash].selectors.push([...group.map(it => it.selector)]);
    //   grouped[hash].selectors = unique(grouped[hash].selectors);
    //   grouped[hash].rating += group.reduce((acc, it) => acc + it.rating, 0) / group.length;
    //   grouped[hash].matches += count;

    //   grouped[hash].rank = (
    //     grouped[hash].matches == 0 ? 0 : grouped[hash].rating
    //   );
    // }

    // const sorted = Object.values(grouped)
    //   .filter(it => it.matches > 0)
    //   .filter(it => it.rating >= 65)
    //   .sort((a, b) => b.rank - a.rank);
    // this.logger.debug(`${this} Got ${sorted.length} candidates, first few are: ${JSON.stringify(sorted.slice(0, 5), null, 2)}`);

    // const best = sorted[0];
    // this.logger.debug(`${this} Using best selector candidate: ${JSON.stringify(best, null, 2)}`);

    // if (!best) {
    //   return;
    // }

    // // Pick the best one within the group
    // const selectors = best.selectors[0];
    // selectors.sort((a, b) => (
    //   map[b].rating - map[b].rating
    // ));

    // // TODO: handle multiple selectors.
    // // This will happen when data does not divid neatly
    // const selector = selectors[0];
    // this.logger.debug(`${this} Using selector: ${selector}`);

    // return { selector, meta: map[selector] };
  }
}
