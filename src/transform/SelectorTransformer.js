import pretty from 'pretty';
import { BaseTransformer } from './BaseTransformer.js';
import * as prompts from './prompts.js';
import { parse } from 'node-html-parser';

export const SelectorTransformer = class extends BaseTransformer {
  constructor(template, options) {
    super(options);
    this.template = template;
  }

  async _transform(html) {
    this.logger.trace('!!');

    const format = {};
    format['_analysis'] = 'Analysis in 10-200 words of how to select the relevant data';
    format['_container'] = 'CSS selector for elements enclosing answers to each question, if available';
    for (const key of Object.keys(this.template)) {
      format[key] = `CSS selector for ${key}`;
    }
    format['_modals'] = 'List of CSS selectors for elements to click in order to clear any modals if present'
    format['_paginate'] = 'CSS selector for element to click to get to the next page if possible';
    format['_shared'] = 'List of keys where the value should be reused on subsequent entries';
    format['_hint'] = 'Any helpful information for answering the questions';
    format['_confidence'] = 'Confidence in overall response effectiveness from 0-100';

    this.logger.info(`${this} Format is: ${JSON.stringify(format)}`);

    const context = {
      html: pretty(html, { ocd: true }),
      template: JSON.stringify(this.template, null, 2),
      format: JSON.stringify(format, null, 2),
    }

    const { prompt } = await prompts.learnCSS.renderCapped(
      context, 'html', this.ai.advanced);

    const answer = await this.ai.advanced.ask(prompt, { format: 'json' });
    const fields = Object.keys(answer.partial).filter(k => !k.startsWith('_'));
    if (answer.partial._combined) {
      fields.push(answer.partial._combined)
    }
    const selectors = fields.map(key => answer.partial[key]);
    this.logger.debug(`${this} Got selectors: ${JSON.stringify(selectors)}`);

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
