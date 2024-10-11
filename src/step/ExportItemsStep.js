import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';
import { getExporter } from '../export/index.js';

export const ExportItemsStep = class extends BaseStep {
  static info = BaseStep.combineInfo({
    name: 'export-items',
    description: 'Exports the entire item result array into a file or cloud service.',
    args: {
      filepath: {
        description: 'Path of the output file, including filenames. For s3, this is the KEY only, and does NOT include the bucket.',
        format: 'string',
        example: 'outputs/out.csv',
        required: true,
      },
      format: {
        description: 'Output format, one of: csv, json, jsonl',
        format: 'string',
        options: ['csv', 'json', 'jsonl'],
        example: 'csv',
        default: 'jsonl',
        required: false,
      },
      destination: {
        description: `The user's destination for the output`,
        format: 'string',
        options: ['s3', 'dropbox', 'file'],
        example: 'dropbox',
        default: 'file',
        required: false,
      },
      s3bucket: {
        description: `If destionation=s3, what is the bucket name. Leave empty if none can be inferred, since it may be in the user's env variables.`,
        format: 'string',
        example: 'my-s3-bucket',
        required: false,
      },
    },
  });

  constructor(args) {
    super(args);
    this.filepath = args?.filepath;

    this.format = args?.format || 'jsonl';
    this.destination = args?.destination || 'file';
    this.s3bucket = args?.s3bucket;
  }

  async *run(cursor) {
    this.exporter = getExporter(this.destination, this.args());
    await this.exporter.open(this.filepath);
    for (const item of cursor.last) {
      await this.exporter.write(item);
      yield Promise.resolve(item);
    }
  }

  async finish() {
    const urls = await this.exporter?.close();
    this.exporter = null;
    return urls;
  }
}
