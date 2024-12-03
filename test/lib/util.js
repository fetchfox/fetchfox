import { S3Cache } from '../../src/cache/S3Cache.js';

export const testCache = (namespace = 'default') => {
  if (!process.env.S3_CACHE_BUCKET) {
    return;
  }

  const params = {
    bucket: process.env.S3_CACHE_BUCKET,
    prefix: `test-cache/${namespace}/`,
    acl: 'public-read',
    ttls: { base: 10 * 365 * 24 * 3600 },
  };
  return new S3Cache(params);
}
