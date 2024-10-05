import { logger } from '../log/logger.js';

export const Template = class {
  constructor(args, base) {
    this.validate(args, base);
    this.base = base;
    this.args = args;
  }

  validate(args, base) {
    const found = [];
    let m;
    const regex = /\{\{(\w+)\}\}/g;
    while ((m = regex.exec(base))) {
      found.push(m[1]);
    }

    const allFound = args.every(arg => found.includes(arg));
    const noExtra = found.every(arg => args.includes(arg));

    if (!allFound) throw new Error(`Missing expected args. Expected: ${args}, Found: ${found}`);
    if (!noExtra) throw new Error(`Found extra args Expected: ${args}, Found: ${found}`);
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
