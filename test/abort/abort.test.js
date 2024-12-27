import assert from 'assert';
import { getFetcher } from '../../src/index.js';

describe('abort', function() {

  it('should abort fetch @run', async () => {
    const fetcher = getFetcher();
    const start = (new Date()).getTime();
    const abortController = new AbortController();
    setTimeout(
      () => {
        abortController.signal.abort();
      },
      10);
    const gen = await fetcher.fetch(
      'https://zillow.com',
      { signal: abortController.signal });
    const doc = (await gen.next()).value;
    const took = (new Date()).getTime() - start;

    console.log('took', took);
  });

});
