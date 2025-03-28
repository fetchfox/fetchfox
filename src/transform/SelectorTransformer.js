import pretty from 'pretty';
import { shortObjHash } from '../util.js';
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

    // const before = pretty(html, { ocd: true });
    // const tt = new TagsTransformer();
    // after = await tt.transform(before);
    // console.log('before', before.length);
    // console.log('after ', after.length);
    
    // throw 'STOP';

    const root = parse(html);

    const key = this.key(url);
    const saved = await this.kv.get(key);

    let selector;
    if (saved) {
      this.logger.debug(`${this} Using saved selectors from ${key}: ${saved}`);
      const data = JSON.parse(saved);
      selector = data.selector;
    } else {
      selector = await this._learn(html, url, root);
    }

    if (!selector) {
      this.logger.debug(`${this} Couldn't find any selectors`);
      return;
    }

    const htmls = [];
    for (const el of root.querySelectorAll(selector)) {
      htmls.push(pretty(el.toString(), { ocd: true }));
    }

    this.logger.debug(`${this} Saving selector in ${key}: ${selector}`);
    await this.kv.set(key, JSON.stringify({ selector }));

    return htmls;
  }

  async _learn(html, url, root) {
    const context = {
      html: pretty(html, { ocd: true }),
      template: JSON.stringify(this.template, null, 2),
    }
    const cssPrompts = await prompts.learnCSS
      .renderMulti(context, 'html', this.ai);

    const answers = (
      await Promise.allSettled(cssPrompts.map(
        (prompt) => this.ai.ask(prompt, { format: 'json' })
      ))
    )
      .filter(it => it.status == 'fulfilled')
      .map(it => it.value);

    const candidates = [];
    const map = {};
    for (const answer of answers) {
      const group = [];
      for (const it of answer.partial) {
        this.logger.debug(`${this} Got selector candidate: ${JSON.stringify(it, null, 2)}`);
        if (it._meta) {
          continue;
        }
        if (!it.selector) {
          continue;
        }
        group.push(it);
        map[it.selector] = it;
      }
      candidates.push(group);
    }

    this.logger.debug(`${this} Selectors map: ${JSON.stringify(map, null, 2)}`);

    const grouped = {};
    for (const group of candidates) {
      const hashes = [];
      let count = 0;
      for (const c of group) {
        const matches = root.querySelectorAll(c.selector);
        for (const node of matches) {
          const h = shortObjHash({ html: node.innerHTML });
          hashes.push(h);
          count++;
        }
      }
      hashes.sort();
      const hash = shortObjHash({ hashes });
      grouped[hash] ||= {
        selectors: [],
        rating: 0,
        matches: 0,
      };

      grouped[hash].selectors.push([...group.map(it => it.selector)]);
      grouped[hash].selectors = unique(grouped[hash].selectors);
      grouped[hash].rating += group.reduce((acc, it) => acc + it.rating, 0) / group.length;
      grouped[hash].matches += count;

      grouped[hash].rank = (
        grouped[hash].matches == 0 ? 0 : grouped[hash].rating
      );
    }

    const sorted = Object.values(grouped)
      .filter(it => it.matches > 0)
      .filter(it => it.rating > 75)
      .sort((a, b) => b.rank - a.rank);
    this.logger.debug(`${this} Got ${sorted.length} candidates, first few are: ${JSON.stringify(sorted.slice(0, 5), null, 2)}`);

    const best = sorted[0];
    this.logger.debug(`${this} Using best selector candidate: ${JSON.stringify(best, null, 2)}`);

    if (!best) {
      return;
    }

    // Pick the best one within the group
    const selectors = best.selectors[0];
    selectors.sort((a, b) => (
      map[b].rating - map[b].rating
    ));

    // TODO: handle multiple selectors.
    // This will happen when data does not divid neatly
    const selector = selectors[0];
    this.logger.debug(`${this} Using selector: ${selector}`);

    return selector;
  }

    // TODO: Remove or refactor old code below
    
    // const matches = [];
    // for (const s of selectors) {
    //   matches.push(...root.querySelectorAll(s));
    // }
    // const matchingNodes = (node, selectors) => {
    //   const nodes = [];
    //   for (const m of matches) {
    //     const same = m == node;
    //     if (same && !nodes.includes(node)) {
    //       nodes.push(node);
    //       break;
    //     }
    //   }
    //   for (const child of node.childNodes) {
    //     nodes.push(...matchingNodes(child, selectors));
    //   }
    //   return nodes;
    // }
    // const include = matchingNodes(root, selectors);

    // const attrsToString = (node) => {
    //   if (!node.attributes) return '';
    //   return Object.entries(node.attributes)
    //     .map(([attr, value]) => ` ${attr}="${value}"`)
    //     .join('');
    // }

    // const toHtml = (node, include) => {
    //   const tagName = node.tagName;
    //   let html = '';
    //   let kept = false;
    //   for (const child of node.childNodes) {
    //     let keep = '';
    //     const text = child.innerHTML;
    //     const ok = include.includes(child);
    //     const childName = child.tagName || 'div'
    //     if (ok) {
    //       const attributes = attrsToString(child);
    //       kept = true;
    //       keep += `<${childName} ${attributes}>` + text;
    //     }

    //     keep += toHtml(child, include);
    //     if (ok) {
    //       keep += `</${childName}>`;
    //     }
    //     html += keep;
    //   }

    //   if (kept) {
    //     const attributes = attrsToString(node);
    //     html = `<${tagName} ${attributes}>` + html + `</${tagName}>`;
    //   }

    //   return html.trim();
    // }
    // const t = pretty(
    //   toHtml(root, [root, ...include]),
    //   { ocd: true });

    // return t;
}
