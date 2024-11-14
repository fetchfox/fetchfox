import { logger } from '../log/logger.js';
import { MemKV } from './MemKV.js';
import { RedisKV } from './RedisKV.js';

export { BaseKV } from './BaseKV.js';

const memKv = new MemKV();

export const getKV = (which, options) => {
  which ||= 'memory';
  if (typeof which != 'string') return which;

  let kvClass = {
    m: MemKV,
    mem: MemKV,
    memory: MemKV,

    r: RedisKV,
    redis: RedisKV,
  }[which];

  if (kvClass == MemKV) {
    logger.debug(`Using shared memory kv`);
    return memKv;
  }

  console.log('kvClass', which, kvClass);

  return new kvClass(options);
}
