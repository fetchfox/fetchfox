import fs from 'node:fs';

import { logger } from '../log/logger.js';

export const Item = class {
  constructor(data, source) {
    this.data = data;
    this.source = source;
  }

  toString() {
    return `[Item: ${JSON.stringify(this.data)}]`;
  }

  save(filename, append, format) {
    if (!format) format = 'json';

    if (!append || !fs.existsSync(filename)) {
      const empty = {
        json: JSON.stringify([], null, 2),
        jsonl: '',
      }[format]
      fs.writeFileSync(filename, empty);
    }

    let data;
    switch (format) {
      case 'json':
        data = JSON.stringify(
          JSON
            .parse(fs.readFileSync(filename, 'utf-8'))
            .concat([this.data]), null, 2);
        break;

      case 'jsonl':
        data = fs.readFileSync(filename, 'utf-8').trim() + '\n' + (JSON.stringify(this.data)) + '\n';
        break;

      default:
        throw 'Unhandled: ' + format;
    }

    return fs.writeFileSync(filename, data);
  }
}
