import assert from 'assert';
import os from 'os';
import { getFetcher } from '../../src/index.js';

process.on('unhandledRejection', async (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  process.exit(1);
});

describe('Fetch', function() {
  this.timeout(0);

  it('should fetch @run', async () => {
    const fetcher = getFetcher();
    const start = (new Date()).getTime();
    const resp = await fetcher.fetch('https://example.com');
    const took = (new Date()).getTime() - start;
    assert.ok(resp.text.indexOf('Example Domain') != -1);
    assert.ok(took < 2000);
  });

  it('should rate limit @run', async () => {
    const unlimitedFetcher = getFetcher(
      'fetch',
      {
        concurrency: 100,
        intervalCap: 100,
        interval: 0,
      });

    const limitedFetcher = getFetcher(
      'fetch',
      {
        concurrency: 5,
        intervalCap: 2,
        interval: 1000,
      });

    const cases = [
      [unlimitedFetcher, 1, 2000],
      [limitedFetcher, 5000, 20000],
    ];

    for (const [fetcher, min, max] of cases) {
      const p = [];
      for (let i = 0; i < 20; i++) {
        p.push(fetcher.fetch('https://example.com'));
      }
      const start = (new Date()).getTime();
      const results = await Promise.all(p);
      const took = (new Date()).getTime() - start;

      for (const resp of results) {
        assert.ok(resp.text.indexOf('Example Domain') != -1);
      }
      assert.ok(took >= min);
      assert.ok(took <= max);
    }
  });
});
