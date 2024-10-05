import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';
import { DiskExporter } from '../index.js';

export const ExportStep = class extends BaseStep {
  constructor(args) {
    super(args);
    this.filename = args?.filename;
    this.format = args?.format || 'jsonl';
  }

  async *run(cursor) {
    const exporter = new DiskExporter({ format: this.format });

    exporter.open(this.filename);
    for (const item of cursor.last) {
      const exportedTo = exporter.write(item);
      yield Promise.resolve({ exportedTo, ...item });
    }    
    exporter.close();
  }
}
