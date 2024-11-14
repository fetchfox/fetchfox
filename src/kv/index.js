import { logger } from '../log/logger.js';
import { MemKV } from './MemKV.js';

const memKv = new MemKV();

export const getKV = (which, options) => {
  which ||= 'memory';

  let kvClass = {
    m: MemKV,
    mem: MemKV,
    memory: MemKV,
  }[which];

  if (kvClass == MemKV) {
    logger.debug(`Using shared memory kv`);
    return memKv;
  }

  return new kvClass(options);
}
