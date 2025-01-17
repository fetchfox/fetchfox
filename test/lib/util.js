import { MultiCache, S3Cache, DiskCache } from "../../src/cache/index.js";

export const testCache = () => {
  const params = {
    region: process.env.S3_CACHE_REGION || "us-west-2",
    bucket: process.env.S3_CACHE_BUCKET || "ffcloud",
    prefix: "test-cache/",
    acl: "public-read",
    ttls: { base: 10 * 365 * 24 * 3600 },
    readOnly: !process.env.WRITE_TEST_CACHE,
  };

  return new MultiCache([
    new DiskCache(".test-cache", {
      ttls: { base: 10 * 365 * 24 * 3600 },
    }),
    new S3Cache(params),
  ]);
};
