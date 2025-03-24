import pretty from 'pretty';
import { shortObjHash } from '../util.js';
import { BaseTransformer } from './BaseTransformer.js';
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

  async _transform(html) {
    const context = {
      html: pretty(html, { ocd: true }),
      template: JSON.stringify(this.template, null, 2),
    }
    const cssPrompts = await prompts.learnCSS.renderMulti(
      context, 'html', this.ai.advanced);

    const candidates = [];
    for (const [i, prompt] of cssPrompts.entries()) {
      const answer = await this.ai.advanced.ask(prompt, { format: 'json' });
      console.log(i, answer.partial);
      const group = [];
      for (const it of answer.partial) {
        if (it._meta) {
          continue;
        }
        console.log(it);
        group.push(it);
      }
      candidates.push(group);
    }

    const root = parse(html);

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

      grouped[hash].rank = grouped[hash].rating * grouped[hash].matches;
    }

    const sorted = Object.values(grouped).sort((a, b) => b.rank - a.rank);
    console.log('candidates:');
    console.log(JSON.stringify(sorted, null, 2));

    const best = sorted[0];
    console.log('best candidate:');
    console.log(JSON.stringify(best, null, 2));

    const selectors = best.selectors[0];

    const matches = [];
    for (const s of selectors) {
      matches.push(...root.querySelectorAll(s));
    }
    const matchingNodes = (node, selectors) => {
      const nodes = [];
      for (const m of matches) {
        const same = m == node;
        if (same && !nodes.includes(node)) {
          nodes.push(node);
          break;
        }
      }
      for (const child of node.childNodes) {
        nodes.push(...matchingNodes(child, selectors));
      }
      return nodes;
    }
    const include = matchingNodes(root, selectors);

    const toHtml = (node, include) => {
      let html = '';
      let kept = false;
      for (const child of node.childNodes) {
        let keep = '';
        const text = child.innerText;
        const ok = include.includes(child);
        if (ok) {
          kept = true;
          keep += '<div>' + text;
        }

        keep += toHtml(child, include);
        if (ok) {
          keep += '</div>';
        }
        html += keep;
        if (keep) {
          html += '\n';
        }
      }

      if (kept) {
        html = '<div>\n' + html.replaceAll('\n', '\n\t') + '</div>';
      }

      return html.trim() ? '<div>' + html + '</div>' : '';
    }
    const t = pretty(
      toHtml(root, [root, ...include]),
      { ocd: true });

    console.log('t', t);
    throw 'STOP YY';
  }

  async old(html) {
    let selectors = [];
    let fields = [];
    for (const prompt of cssPrompts) {
      const answer = await this.ai.advanced.ask(prompt, { format: 'json' });
      fields.push(...Object.keys(answer.partial).filter(k => !k.startsWith('_')));
      if (answer.partial._combined) {
        fields.push(answer.partial._combined)
      }
      this.logger.debug(`${this} Got answer: ${JSON.stringify(answer.partial, null, 2)}`);
      // const selectors = fields.map(key => answer.partial[key]);
      selectors.push(...fields.map(key => answer.partial[key]));
      this.logger.debug(`${this} Got selectors: ${JSON.stringify(selectors, null, 2)}`);

      fields = unique(fields);
      selectors = unique(selectors);
      console.log('got fields:   ', fields);
      console.log('got selectors:', selectors);
    }

    const root = parse(html);
    const matches = [];
    for (const f of fields) {
      const s = answer.partial[f];
      const matches = root.querySelectorAll(s);
      for (const node of matches) {
        if (!node.field) {
          node.field = f;
          node.extraFields = [];
        } else {
          node.extraFields.push(f);
        }
      }
      matches.push(...root.querySelectorAll(s));
    }

    const matchingNodes = (node) => {
      const nodes = [];
      if (node.field) {
        nodes.push(node);
      }

      for (const child of node.childNodes) {
        nodes.push(...matchingNodes(child));
      }

      return nodes;
    }
    const include = matchingNodes(root);

    const sharedFields = fields.filter(f => (answer.partial._shared ?? []).includes(f));
    const normalFields = fields.filter(f => !sharedFields.includes(f));

    const prune = (node) => {
      let kept = !!node.field;
      for (const child of node.childNodes) {
        if (prune(child)) {
          kept = true;
        } else {
          // if HTML element
          if (child.tagName) {
            child.remove();
          }
        }
      }
      if (kept) {
        return node;
      } else {
        return null;
      }
    }

    const collect = (node) => {
      const kept = !!node.field;
      const keep = [];
      for (const child of node.childNodes) {
        keep.push(...collect(child));
      }

      if (kept) {
        return [node];
      } else {
        return keep;
      }
    }

    const addAll = (node) => {
      // collect descendants to include
      const include = [];
      let current = collect(node);
      while (current.length > 0) {
        include.push(...current);
        let children = []
        for (n of current) {
          children.push(...n.childNodes.map(n => collect(n)));
        }
        current = children;
      }

      const obj = {};
      for (const el of include) {
        const value = el.toString();
        const fields = [el.field, ...el.extraFields];
        for (const field of fields) {
          // Add value(s) to current object
          if (field in obj) {
            if (!Array.isArray(obj[field])) {
              obj[field] = [obj[field]];
            }
            obj[field].push(value);
          } else {
            obj[field] = value;
          }
        }
      }
      return obj;
    }

    const toObj = (include) => {
      const result = [];
      let obj = {};
      let context = {};
      let prev = null;

      for (const el of include) {
        const fields = [el.field, ...el.extraFields];
        for (const field of fields) {
          if (fields.includes('_container')) {
            result.push(addAll(el));
            continue;
          } else {
            // Otherwise, treat as sequential
            const value = el.toString();

            // Handle shared fields (e.g., generation as a header)
            if (sharedFields.includes(field)) {
              if (Object.keys(obj).length != 0) {
                result.push({ ...context, ...obj });
              }
              obj = {};
              context[field] = value;
              prev = null;
              continue; // Wait for a normal field to add to the object
            }

            // Check if this field starts a new object
            if (normalFields.includes(field) && field in obj && prev != field) {
              result.push({ ...context, ...obj });
              obj = {};
            }

            // Add value(s) to current object
            if (field in obj) {
              if (!Array.isArray(obj[field])) {
                obj[field] = [obj[field]];
              }
              obj[field].push(value);
            } else {
              obj[field] = value;
            }
            prev = field;
          }
        }
      }

      // Add last object if incomplete but has data
      if (Object.keys(obj).length > 0) {
        result.push({ ...context, ...obj });
      }

      return result;
    }

    // This modifies the parsed root
    const pruned = prune(root);
    const obj = toObj(include);

    // TODO: store learned
    // this.learned = {
    //   format,
    //   response: answer.partial,
    //   analysis: answer.partial.analysis,
    //   hint: pretty(answer.partial.hint, { ocd: true }),
    // }

    return pretty(pruned.toString(), { ocd: true });
  }
}
