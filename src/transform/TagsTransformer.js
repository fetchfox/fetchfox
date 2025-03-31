import { BaseTransformer } from './BaseTransformer.js';
import { parse } from 'node-html-parser';

export const TagsTransformer = class extends BaseTransformer {
  constructor(config, options) {
    super(options);
    this.removeTags = config?.removeTags || ['style', 'meta', 'svg', 'symbol', 'link'];
    this.removeAttributes = config?.removeAttributes || ['style', 'srcset'];
    this.clipLength = config?.clipLength || 200;
  }

  async _transform(html) {
    const root = parse(html);

    const remove = this.removeAttributes;
    const prune = (node) => {
      if (node.attributes) {
        for (const attr of Object.keys(node.attributes)) {
          if (remove.includes(attr)) {
            node.removeAttribute(attr);
          } else {
            const val = node.attributes[attr];
            if (val.length > this.clipLength) {
              node.attributes[attr] = val.slice(0, this.clipLength);
            }
          }
        }
      }

      for (const child of node.childNodes) {
        if (child.tagName && this.removeTags.includes(child.tagName.toLowerCase())) {
          node.removeChild(child);
        }
      }

      for (const child of node.childNodes) {
        prune(child);
      }
    }

    prune(root);

    return root.toString();
  }
}
