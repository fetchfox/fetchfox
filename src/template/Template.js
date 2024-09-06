import { logger } from '../log/logger.js';

export const Template = class {
  constructor(base) {
    this.base = base;
  }

  render(context) {
    let prompt = this.base;
    for (const key of Object.keys(context)) {
      const val = (context[key] || '');
      prompt = prompt.replaceAll('{{' + key + '}}', val);
    }
    return prompt;
  }
}
