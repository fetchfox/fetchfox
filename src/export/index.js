import { DiskExporter } from './DiskExporter.js';

export const getExporter = (options) => {
  return new DiskExporter(options);
}
