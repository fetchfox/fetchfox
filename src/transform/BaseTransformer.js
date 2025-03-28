import { logger as defaultLogger } from '../log/logger.js';
import { getAI } from '../ai/index.js';
import { getKV } from '../kv/index.js';

export const BaseTransformer = class {
  constructor(options) {
    const { ai, signal, cache, logger } = options || {};
    this.logger = logger || defaultLogger;
    this.ai = getAI(ai, { cache, signal, logger });
    this.kv = options?.kv || getKV();
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  async transform(html, ...args) {
    this.logger.debug(`${this} Transforming ${html.length} bytes of html`);
    const t = await this._transform(html, args);
    const reduced = Array.isArray(t) ? t.join('') : t;
    this.logger.debug(`${this} Transformed ${html.length} -> ${reduced?.length} bytes`);
    return t;
  }
}
