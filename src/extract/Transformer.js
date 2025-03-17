import pretty from 'pretty';
import { parse } from 'node-html-parser';
import { logger as defaultLogger } from "../log/logger.js";
import { getKV } from '../kv/index.js';
import { getAI } from '../ai/index.js';
import * as prompts from './prompts.js';

export const Transformer = class {
  constructor(options) {
    this.kv = options?.kv || getKV();
    this.ai = options?.ai || getAI(null, { cache: this.cache });
    this.logger = options?.logger || defaultLogger
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  async reduce(html, template) {
    this.logger.debug(`${this} Transforming ${html.length} bytes of html based on ${JSON.stringify(template)}`);

    const format = {};
    for (const key of Object.keys(template)) {
      format[key] = `CSS selector for ${key}`;
    }

    const context = {
      html: html,
      template: JSON.stringify(template, null, 2),
      format: JSON.stringify(format, null, 2),
    }

    const { prompt } = await prompts.learnCSS.renderCapped(
      context, 'html', this.ai.advanced);

    const answer = await this.ai.advanced.ask(prompt, { format: 'json' });
    const selectors = Object.values(answer.partial);
    this.logger.debug(`${this} Got selectors: ${JSON.stringify(selectors)}`);

    // TODO: figure out where to put this
    const root = parse(html);
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

    const attrsToString = (attrs) => Object.entries(attrs)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');

    const toHtml = (node, include) => {
      let html = '';
      let kept = false;

      for (const child of node.childNodes) {
        let keep = '';
        const text = child.innerText;
        const ok = include.includes(child);

        const tagName = child.tagName || 'div';

        if (ok) {
          kept = true;
          const attrs = child.attributes && Object.keys(child.attributes).length
                      ? ' ' + attrsToString(child.attributes)
            : '';

          keep += `<${tagName}${attrs}>` + text;
        }

        keep += toHtml(child, include);

        if (ok) {
          keep += `</${tagName}>`;
        }

        html += keep;
        if (keep) {
          html += '\n';
        }
      }

      if (kept) {
        const tagName = node.tagName || 'div';
        const attrs = node.attributes && Object.keys(node.attributes).length
                    ? ' ' + attrsToString(node.attributes)
          : '';

        html = `<${tagName}${attrs}>\n` + html.replaceAll('\n', '\n\t') + `</${tagName}>`;
      }

      return pretty(html, { ocd: true });
    }

    const reduced = toHtml(root, [root, ...include]);

    this.logger.debug(`${this} Reduced ${html.length} -> ${reduced.length} bytes of html based on ${JSON.stringify(template)}`);

    return reduced;
  }
}
