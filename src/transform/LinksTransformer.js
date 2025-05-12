import { parse } from 'node-html-parser';
import { BaseTransformer } from './BaseTransformer.js';

export const LinksTransformer = class extends BaseTransformer {
  async _transform(html) {
    const root = parse(html);

    const visit = (node) => {
      if (node.nodeType == 3) {
        return node.rawText;
      }

      const tagName = (node.tagName || '').toLowerCase();

      const href = node.getAttribute('href');
      const children = node.childNodes || [];
      const inner = children.map(visit).join('');

      if (tagName == 'a' && href) {
        return `<a href="${href}">${inner}</a>`;
      } else {
        return inner;
      }
    };

    const out = '<html>' + visit(root) + '</html>';
    
    return { html: out };
  }
}
