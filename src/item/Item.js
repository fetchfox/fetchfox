import fs from 'fs';
import path from 'path';

import { logger } from '../log/logger.js';

export const Item = class {
  #source;

  constructor(data, source) {
    for (const k of Object.keys(data)) {
      this[k] = this.clean(data[k]);
    }
    this.#source = source;
  }

  clean(val) {
    val = '' + val;
    val = val.trim();
    if (/^[0-9,]+$/.test(val)) {
      val = val.replace(/,/g, '');
    }
    if (val == 'not found') {
      val = '(not found)';
    }
    return val;
  }

  toString() {
    return `[Item: ${JSON.stringify(this).substr(0, 40)}... from ${this.#source}]`;
  }

  source() {
    return this.#source;
  }

  save(filename, options) {
    const { append, format, saveSource } = options || {};
    if (!format) format = 'json';

    if (!append || !fs.existsSync(filename)) {
      const empty = {
        json: JSON.stringify([], null, 2),
        jsonl: '',
      }[format]
      fs.writeFileSync(filename, empty);
    }

    let out;
    let data = JSON.parse(JSON.stringify(this));
    if (saveSource) {
      data.source = this.#source.save(path.dirname(filename));
    }
    switch (format) {
      case 'json':
        out = JSON.stringify(
          JSON
            .parse(fs.readFileSync(filename, 'utf-8'))
            .concat([data]), null, 2);
        break;

      case 'jsonl':
        out = fs.readFileSync(filename, 'utf-8').trim() + '\n' + (JSON.stringify(data)) + '\n';
        break;

      default:
        throw 'Unhandled: ' + format;
    }

    return fs.writeFileSync(filename, out);
  }
}
