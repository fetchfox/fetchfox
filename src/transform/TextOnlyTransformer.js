import { parse } from 'node-html-parser';
import { BaseTransformer } from './BaseTransformer.js';

export const TextOnlyTransformer = class extends BaseTransformer {
  async _transform(html) {
    const root = parse(html);

    const text = (node, level) => {
      let out = ''
      const indent = '    '.repeat(level);
      let hasTextChildren = node.childNodes.filter(it => it.nodeType == 3).length;
      const childLevel = hasTextChildren ? level + 1 : level;
      for (const child of node.childNodes) {
        if (child.nodeType == 3) {
          out += indent + (child.rawText || '').trim().replaceAll('\n', indent + '\n') + '\n';
        }
      }
      for (const child of node.childNodes) {
        if (child.nodeType != 3) {
          const childOut = text(child, childLevel);
          if ((childOut || '').trim()) {
            out += childOut;
          }
        }
      }
      return out ? out : '';
    }

    const out = text(root, 0)
      .replaceAll(/\n +\n/g, '\n')
      .replaceAll(/\n +\n/g, '\n')
      .replaceAll(/\n +\n/g, '\n')
      .replaceAll(/\n +\n/g, '\n');
    
    return { html: out };
  }
}
