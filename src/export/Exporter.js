import fs from 'fs';
import AWS from 'aws-sdk';
import { logger } from '../log/logger.js';
import { BaseExporter } from './BaseExporter.js';
import { publishToS3 } from './publish.js';

export const Exporter = class extends BaseExporter {
  constructor(options) {
    super(options);
    this.destination = options.destination;

    switch (this.destination) {
      case 's3':
        this.s3 = new AWS.S3();
        this.s3bucket = options.s3bucket || process.env.AWS_S3_BUCKET;
        if (!this.s3bucket) throw new Error('No bucket specified for S3 export');
        break;

      case 'file':
        break;

      default:
        throw new Error(`Unhandled destination: ${this.destination}`);
    }
  }

  async open(path) {
    logger.info(`Start export to ${path}"`);

    switch (this.destination) {
      case 's3':
        this.key = path;
        break;

      case 'file':
        this.filepath = path;
        this.file = fs.createWriteStream(this.filepath);
        break;

      default:
        throw new Error(`Unhandled destination: ${this.destination}`);
    }

    console.log('SET BUFFER');
    this.buffer = [];
  }

  async write(item) {
    logger.info(`Push ${item} for export"`);
    this.buffer.push(item);

    switch (this.destination) {
      case 's3': return `https://${this.s3bucket}.s3.amazonaws.com/${this.key}`;
      case 'file': return this.filepath;
      default: throw new Error(`Unhandled destination: ${this.destination}`);
    }
  }

  async close() {
    let contentType;
    let body;

    switch (this.format) {
      case 'jsonl':
        logger.info(`Serialize JSONL`);
        contentType = 'application/jsonlines';
        body = this.buffer.map(x => JSON.stringify(x)).join('\n');
        break;

      case 'json':
        logger.info(`Serialize JSON`);
        contentType = 'application/json';
        body = JSON.stringify(this.buffer, null, 2);
        break;

      case 'csv':
        logger.info(`Serialize CSV`);
        contentType = 'text/csv';

        const headersDict = {};
        for (const item of this.buffer) {
          Object.keys(item).map(h => headersDict[h] = true);
        }
        const headers = Object.keys(headersDict);
        const options = { header: true, columns: headers };
        body = await new Promise(
          (ok, bad) => stringify(
            this.buffer,
            options,
            (err, output) => {
              if (err) bad(err);
              else ok(output);
            }));
        break;
    }

    this.buffer = null;

    let url;
    switch (this.destination) {
      case 's3':
        url = await publishToS3(
          body,
          contentType,
          'public-read',
          this.s3bucket,
          this.key);
        break;

      case 'file':
        this.file.write(body);
        this.file.end();
        url = this.filepath;
        break;

      default: throw new Error(`Unhandled destination: ${this.destination}`);
    }

    this.s3bucket = null;
    this.key = null;
    this.filepath = null
    this.file = null;

    return url;
  }
}
