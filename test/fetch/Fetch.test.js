import assert from 'assert';
import os from 'os';
import { getFetcher } from '../../src/index.js';

describe('Fetch', function() {
  this.timeout(60 * 1000);

  it('should fetch @run', async () => {
    const fetcher = getFetcher();
    const start = (new Date()).getTime();
    const gen = await fetcher.fetch('https://example.com');
    const doc = (await gen.next()).value;
    const took = (new Date()).getTime() - start;
    assert.ok(doc.text.indexOf('Example Domain') != -1);
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
        p.push(new Promise(async (ok) => {
          const gen = await fetcher.fetch('https://example.com');
          const resp = await gen.next();
          ok(resp.value);
        }));
      }

      const start = (new Date()).getTime();
      const results = await Promise.all(p);
      const took = (new Date()).getTime() - start;

      for (const doc of results) {
        assert.ok(doc.text.indexOf('Example Domain') != -1);
      }
      assert.ok(took >= min);
      assert.ok(took <= max);
    }
  });
});
