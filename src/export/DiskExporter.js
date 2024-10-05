import fs from 'fs';
import { logger } from '../log/logger.js';
import { stringify } from 'csv-stringify';
import { BaseExporter } from './BaseExporter.js';

export const DiskExporter = class extends BaseExporter {
  constructor(options) {
    super(options);
  }

  async open(filename) {
    logger.info(`Open ${filename} for export"`);
    if (this.file) throw new Error('File already open');
    this.file = fs.createWriteStream(filename); // TODO: handle appends vs. truncate

    switch (this.format) {
      case 'json':
      case 'csv':
        this.buffer = [];
        break;
    }
  }

  async write(item) {
    logger.info(`Write ${item} to ${this.filename}"`);

    if (!this.file) throw new Error('No file open for writing');

    switch (this.format) {
      case 'jsonl':
        this.file.write(JSON.stringify(item) + '\n');
        break;
      case 'json':
      case 'csv':
        this.buffer.push(item);
        break;
      default:
        throw new Error(`Unsupported format: ${this.format}`);
    }
  }

  async close() {
    if (!this.file) throw new Error('No file open for writing');

    switch (this.format) {
      case 'json':
        logger.info(`Serialize JSON into ${this.filename}"`);
        this.file.write(JSON.stringify(this.buffer, null, 2));
        break;

      case 'csv':
        logger.info(`Serialize CSV into ${this.filename}"`);

        const headersDict = {};
        for (const item of this.buffer) {
          Object.keys(item).map(h => headersDict[h] = true);
        }
        const headers = Object.keys(headersDict);
        const options = { header: true, columns: headers };
        const out = await new Promise(
          (ok, bad) => stringify(
            this.buffer,
            options,
            (err, output) => {
              if (err) bad(err);
              else ok(output);
            }));

        this.file.write(out);
        break;
    }

    logger.info(`Close ${this.filename}"`);
    this.file.end();
    this.file = null;
    this.buffer = null;
  }
}
