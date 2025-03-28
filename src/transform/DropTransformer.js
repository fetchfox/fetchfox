import { BaseTransformer } from './BaseTransformer.js';
import { parse } from 'node-html-parser';

export const DropTransformer = class extends BaseTransformer {
  constructor(config, options) {
    super(options);
    this.limit = config?.limit || 16;
  }

  async _transform(html) {
    const shape = (node, i) => {
      if (i == 0) return '';

      let s = '{' + (node.tagName || '.');
      for (const child of node.childNodes) {
        s += shape(child, i - 1);
      }
      s += '}';
      return s;
    }

    const maybePrune = (s, parent, children) => {
      const l = Math.floor(this.limit / 2);
      let count = 0;
      for (let i = l; i < children.length - l; i++) {
        parent.removeChild(children[i]);
        count++;
      }
      if (count > 0) {
        this.logger.debug(`${this} Dropped ${count} nodes with shape ${s}`);
      }
    }

    const process = (node) => {
      let current = '';
      let run = [];
      const runs = {};

      let c = 0;

      for (const child of node.childNodes) {
        if (child.nodeType == 3) {
          continue;
        }

        const s = shape(child, 2);
        runs[s] ||= [];
        runs[s].push(child);
        c++;
      }

      for (const [key, run] of Object.entries(runs)) {
        maybePrune(key, node, run);
      }

      node.childNodes.forEach(process);

      return node;
    }
    const root = parse(html);
    const dropHtml = process(root).toString();
    return dropHtml;
  }
}
