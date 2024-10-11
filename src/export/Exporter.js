import fs from 'fs';
import playwright from 'playwright';
import { logger } from '../log/logger.js';
import { BaseExporter } from './BaseExporter.js';
import { publishToS3, publishToDropbox } from './publish.js';
import { stringify } from 'csv-stringify';

export const Exporter = class extends BaseExporter {
  constructor(options) {
    super(options);

    this.destination = options.destination;
    this.field = options.field;
    this.mode = options.mode || 'combined';

    switch (this.destination) {
      case 's3':
        this.s3bucket = options.s3bucket || process.env.AWS_S3_BUCKET;
        if (!this.s3bucket) throw new Error('No bucket specified for S3 export');
        break;

      case 'dropbox':
        this.dropboxToken = options.tokens?.dropbox || process.env.DROPBOX_ACCESS_TOKEN;
        break;

      case 'file':
        break;

      case 'pdf':
        this.field = options.field;
        break;

      default:
        throw new Error(`Unhandled destination: ${this.destination}`);
    }
  }

  async open(filepath) {
    logger.info(`Start export to ${filepath}"`);

    switch (this.destination) {
      case 's3':
        this.filepath = filepath;
        break;

      case 'dropbox':
        this.filepath = filepath.startsWith('/') ? filepath : '/' + filepath;
        break;

      case 'file':
        this.filepath = filepath;
        this.file = fs.createWriteStream(this.filepath);
        break;

      default:
        throw new Error(`Unhandled destination: ${this.destination}`);
    }

    this.buffer = [];
  }

  async write(item) {
    logger.info(`Push ${item} for export"`);
    this.buffer.push(item);
  }

  async close() {
    const buffer = this.buffer || [];
    this.buffer = null;

    let batches;
    switch (this.mode) {
      case 'combined': batches = [buffer]; break;
      case 'separate': batches = buffer.map(x => [x]); break;
      default: throw new Error(`Unhandled mode ${this.mode}`);
    }

    let urls = [];
    for (const batch of batches) {
      if (!batch?.length) continue;

      let url;
      let contentType;
      let body;
      let filepath = this.filepath;

      switch (this.format) {
        case 'jsonl':
          logger.info(`Serialize JSONL`);
          contentType = 'application/jsonlines';
          body = batch.map(x => JSON.stringify(x)).join('\n');
          break;

        case 'json':
          logger.info(`Serialize JSON`);
          contentType = 'application/json';
          body = JSON.stringify(batch, null, 2);
          break;

        case 'csv':
          logger.info(`Serialize CSV`);
          contentType = 'text/csv';

          const headersDict = {};
          for (const item of batch) {
            Object.keys(item).map(h => headersDict[h] = true);
          }
          const headers = Object.keys(headersDict);
          const options = { header: true, columns: headers };
          body = await new Promise(
            (ok, bad) => stringify(
              batch,
              options,
              (err, output) => {
                if (err) bad(err);
                else ok(output);
              }));
          break;

        case 'pdf':
          if (this.mode != 'separate') {
            throw new Error('TODO: combined pdf rendering');
          }

          for (const item of batch) {
            logger.info(`Render PDF for ${item} field ${this.field}`);
            const url = item[this.field];
            logger.info(`Render URL ${url}`);
            const cleanUrl = url.replace(/[^A-Za-z0-9]+/g, '-');
            filepath = filepath.replace(/{url}/g, cleanUrl);
            body = await this.render(url);
          }
      }

      switch (this.destination) {
        case 's3':
          url = await publishToS3(
            body,
            contentType,
            'public-read',
            this.s3bucket,
            filepath);
          break;

        case 'dropbox':
          url = await publishToDropbox(body, filepath, this.dropboxToken);
          break;

        case 'file':
          this.file.write(body);
          this.file.end();
          url = filepath;
          break;

        default: throw new Error(`Unhandled destination: ${this.destination}`);
      }

      batch.map(() => urls.push(url));
    }

    this.key = null;
    this.filepath = null
    this.file = null;

    if (this.browser) await this.browser.close();

    return urls;
  }

  async render(url) {
    if (!this.browser) {
      this.browser = await playwright.chromium.launch();
    }

    const page = await this.browser.newPage();
    await page.goto(url);
    await page.waitForTimeout(2000);
    const buf = await page.pdf({ format: 'A4' });

    return buf;
  }
}
