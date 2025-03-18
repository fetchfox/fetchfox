import assert from 'assert';
import os from 'os';
import { getFetcher } from '../../src/index.js';

describe('Fetch', function() {

  it('should abort @fast', async () => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetcher = getFetcher('fetch', { signal });

    const start = (new Date()).getTime();
    const gen = await fetcher.fetch('https://example.com');
    controller.abort();
    const doc = (await gen.next()).value;
    const took = (new Date()).getTime() - start;

    assert.ok(!doc);
    assert.ok(took < 50);
  });

});
