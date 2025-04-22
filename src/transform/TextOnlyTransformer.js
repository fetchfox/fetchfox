import { parse } from 'node-html-parser';
import { BaseTransformer } from './BaseTransformer.js';

export const TextOnlyTransformer = class extends BaseTransformer {
  async _transform(html) {
    const root = parse(html);
    return { html: root.textContent.replaceAll(/\n[ \n\t]+/g, '\n')};
  }
}
