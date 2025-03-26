import { logger } from '../log/logger.js';
import { BaseKV } from './BaseKV.js';
import { MemKV } from './MemKV.js';
import { DiskKV } from './DiskKV.js';
import { S3KV } from './S3KV.js';

export { MemKV } from './MemKV.js';
export { DiskKV } from './DiskKV.js';
export { S3KV } from './S3KV.js';
export { BaseKV } from './BaseKV.js';

export const getKV = (which, options) => {
  if (which instanceof BaseKV) {
    return which;
  }
  if (!which) {
    which = 'mem';
  }

  const classes = {
    mem: MemKV,
    disk: DiskKV,
    s3: S3KV,
  }

  let kvClass = classes[which];
  if (!kvClass) {
    logger.error(`Unknown kv: ${which}`);
    return;
  }
  return new kvClass(options);
}
