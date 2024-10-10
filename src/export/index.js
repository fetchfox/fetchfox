import { logger } from '../log/logger.js';
// import { DiskExporter } from './DiskExporter.js';
import { Exporter } from './Exporter.js';

export const getExporter = (which, options) => {
  return new Exporter({ ...options, destination: which });

  // if (!which) which = 'file';
  // if (typeof which != 'string') return which;

  // let exporterClass = {
  //   disk: Exporter,
  //   file: Exporter,

  //   s3: Exporter,
  // }[which];

  // if (!exporterClass) {
  //   logger.error(`Unknown exporter type: ${which}`);
  //   return;
  // }

  // return new exporterClass({ options);
}
