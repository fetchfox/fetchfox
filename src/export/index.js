import { logger } from '../log/logger.js';
import { Exporter } from './Exporter.js';

export const getExporter = (which, options) => {
  return new Exporter({ ...options, destination: which });
}
