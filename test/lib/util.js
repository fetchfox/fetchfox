import {
  MultiCache,
  S3Cache,
  DiskCache,
} from '../../src/cache/index.js';

export const testCache = () => {
  const rw = {
    readOnly: !process.env.WRITE_TEST_CACHE && !process.env.WRITE_ONLY_TEST_CACHE,
    writeOnly: process.env.WRITE_ONLY_TEST_CACHE,
  };
  const params = {
    region: process.env.S3_CACHE_REGION || 'us-west-2',
    bucket: process.env.S3_CACHE_BUCKET || 'ffcloud',
    prefix: 'test-cache/',
    acl: 'public-read',
    ttls: { base: 10 * 365 * 24 * 3600 },
    ...rw,
  };

  return new MultiCache([
    new DiskCache(
      '.test-cache',
      {
        ttls: { base: 10 * 365 * 24 * 3600 },
        ...rw,
      }),
    new S3Cache(params),
  ]);
}

export const setTestTimeout = (that, msec) => {
  if (
    process.env.WRITE_TEST_CACHE ||
    process.env.WRITE_ONLY_TEST_CACHE
  ) {
    that.timeout(60 * 1000);
  } else {
    that.timeout(msec);
  }
}
