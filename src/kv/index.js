import { logger } from '../log/logger.js';
import { BaseKV } from './BaseKV.js';
import { DiskKV } from './DiskKV.js';

export { DiskKV } from './DiskKV.js';
export { BaseKV } from './BaseKV.js';

export const getKV = (which, options) => {
  if (which instanceof BaseKV) {
    return which;
  }
  if (!which) {
    which = 'disk';
  }

  const classes = {
    d: DiskKV,
    disk: DiskKV,
  }

  let kvClass = classes[which];
  if (!kvClass) {
    logger.error(`Unknown kv: ${which}`);
    return;
  }
  return new kvClass(options);
}
