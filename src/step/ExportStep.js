import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';
import { DiskExporter } from '../index.js';

export const ExportStep = class extends BaseStep {
  static info = {
    name: 'export',
    description: 'Export data to a file',
    args: {
      filename: {
        description: 'Name of the output file. Format: string',
        example: 'out.csv',
      },
      format: {
        description: 'Output format, one of: csv, json, jsonl',
        example: 'csv',
      },
    },
  };

  constructor(args) {
    super(args);
    this.filename = args?.filename;
    this.format = args?.format || 'jsonl';
  }

  args() {
    return {
      filename: this.filename,
      format: this.format,
    };
  }

  async *run(cursor) {
    this.exporter = new DiskExporter({ format: this.format });
    this.exporter.open(this.filename);
    for (const item of cursor.last) {
      const exportedTo = await this.exporter.write(item);
      yield Promise.resolve({ exportedTo, ...item });
    }
  }

  finish() {
    this.exporter.close();
    this.exporter = null;
  }
}
