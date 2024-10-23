import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';
import { getExporter } from '../export/index.js';

export const ExportItemsStep = class extends BaseStep {
  constructor(args) {
    super(args);
    this.filepath = args?.filepath;

    this.format = args?.format || 'jsonl';
    this.destination = args?.destination || 'file';
    this.s3bucket = args?.s3bucket;
  }

  async before(cursor) {
    this.exporter = getExporter(this.destination, this.args());
    await this.exporter.open(this.filepath);
  }

  async process({ cursor, item }, cb) {
    logger.debug(`Export item ${item}`);
    await this.exporter.write(item);
    cb(item);
  }

  async finish() {
    const urls = await this.exporter?.close();
    this.exporter = null;
    return urls;
  }
}
