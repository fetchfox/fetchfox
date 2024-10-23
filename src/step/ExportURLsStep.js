import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';
import { getExporter } from '../export/index.js';

export const ExportURLsStep = class extends BaseStep {
  constructor(args) {
    super(args);
    this.filename = args?.filename || '{url}.pdf'
    this.directory = args?.directory || ''
    this.field = args.field;

    this.format = args.format || 'pdf';
    this.destination = args.destination || 'file';
    this.mode = 'separate'; // TODO: combined URLs export
    this.s3bucket = args?.s3bucket;
  }

  async process({ cursor, item, index }, cb) {
    logger.debug(`Export URL field ${this.field} of item ${item}`);

    const args = this.args();
    args.mode = this.mode;
    const filepath = (this.directory
                    ? `${this.directory}/${this.filename}`
                    : this.filename)
    args.filepath = filepath;
    args.tokens = cursor.ctx.tokens;
    const exporter = getExporter(this.destination, args);
    exporter.open(filepath);

    await exporter.write(item);

    const [url] = await exporter.close();

    const key = `Step${index + 1}_Export`;
    item[key] = url;

    cb(item);
  }
}
