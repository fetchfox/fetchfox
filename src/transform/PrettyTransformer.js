import pretty from 'pretty';
import { BaseTransformer } from './BaseTransformer.js';

export const PrettyTransformer = class extends BaseTransformer {
  async _transform(html) {
    return pretty(html, { ocd: true });
  }
}
