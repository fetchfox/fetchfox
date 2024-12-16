import { S3Cache } from '../../src/cache/S3Cache.js';

export const testCache = () => {
  const params = {
    bucket: process.env.S3_CACHE_BUCKET || 'ffcloud',
    prefix: 'test-cache/',
    acl: 'public-read',
    ttls: { base: 10 * 365 * 24 * 3600 },
    readOnly: !process.env.WRITE_TEST_CACHE,
  };
  return new S3Cache(params);
};

export const testCacheConfig = () => {
  return [
    's3',
    {
      bucket: process.env.S3_CACHE_BUCKET || 'ffcloud',
      prefix: 'test-cache/',
      acl: 'public-read',
      ttls: { base: 10 * 365 * 24 * 3600 },
      readOnly: !process.env.WRITE_TEST_CACHE,
    },
  ];
};
