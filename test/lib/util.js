import { DiskCache } from '../../src/cache/DiskCache.js';

export const testDiskCachePath = './test/data/cache';

export const testCache = () => {
  return new DiskCache(testDiskCachePath);
}
