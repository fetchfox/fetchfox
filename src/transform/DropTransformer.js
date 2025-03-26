import { BaseTransformer } from './BaseTransformer.js';
import { parse } from 'node-html-parser';

export const DropTransformer = class extends BaseTransformer {
  async _transform(html) {
    const dropMiddle = (node) => {
      const n = node.childNodes.length;
      const l = 10;
      if (n > 2 * l) {
        const first = node.childNodes.slice(0, l);
        const middle = node.childNodes.slice(l, -l);
        const last = node.childNodes.slice(-l);

        for (const child of [...first, ...last]) {
          dropMiddle(child);
        }
        for (const child of middle) {
          child.remove();
        }
      }
    }

    const root = parse(html);
    const dropHtml = dropMiddle(root).toString();
    return dropHtml;
  }
}
