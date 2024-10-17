import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';
import { getExporter } from '../export/index.js';

export const ExportURLsStep = class extends BaseStep {
  static info = BaseStep.combineInfo({
    name: 'exportUrls',
    description: `Get URLs from a specific field of the items, render those URLs into PDF, and export them into a file or cloud service`,
    args: {
      field: {
        description: `The item field containing the target URL. The value here MUST be an EXACT string from a previous 'extract' or 'schema' step`,
        format: 'string',
        example: 'What is the URL of the linked article? Format: Absolute URL',
        required: true,
      },
      format: {
        description: `The user's desired output format`,
        format: 'choices',
        choices: ['pdf'],
        example: 'pdf',
        default: 'pdf',
        required: true,
      },
      destination: {
        description: `The user's destination for the output. Use absolute path, starting with /`,
        format: 'choices',
        choices: ['s3', 'dropbox', 'file'],
        default: 's3',
        example: 'dropbox',
        required: true,
      },
      s3bucket: {
        description: `If destionation=s3, what is the bucket name. Leave empty if none can be inferred, since it may be in the user's env variables.`,
        format: 'string',
        example: 'my-s3-bucket',
        required: false,
      },
      filepathTemplate: {
        description: `Filename template of the output files. Template may use {url} as part of the filename, which will differentiate the various rendered URLs`,
        format: 'string',
        example: 'pdfs/articles-{url}.pdf',
        default: '{url}.pdf',
        required: true,
      },
    },
  });

  constructor(args) {
    super(args);
    this.filepathTemplate = args?.filepathTemplate;
    this.field = args.field;

    this.format = args.format || 'pdf';
    this.destination = args.destination || 'file';
    this.mode = 'separate'; // TODO: combined URLs export
    this.s3bucket = args?.s3bucket;
  }

  async before(cursor) {
    const args = this.args();
    args.mode = this.mode;
    args.filepath = this.filepathTemplate;
    args.tokens = cursor.ctx.tokens;
    this.exporter = getExporter(this.destination, args);
    this.exporter.open(this.filepathTemplate);
  }

  async process(cursor, item, cb) {
    logger.verbose(`Export URL field ${this.field} of item ${item}`);
    await this.exporter.write(item);
    cb(item);
  }

  async finish() {
    const urls = await this.exporter?.close();
    this.exporter = null;
    return urls;
  }
}
