import assert from 'assert';
import os from 'os';
import { getFetcher } from '../../src/index.js';

describe('PlaywrightFetcher', function() {

  it('should fetch @run', async () => {
    const fetcher = getFetcher('playwright', { loadWait: 1 });

    const gen = await fetcher.fetch('https://example.com');
    const doc = (await gen.next()).value;
    gen.return();

    assert.ok(doc.text.indexOf('Example Domain') != -1);
    assert.ok(doc.html.indexOf('Example Domain') != -1);
  });

  it('should abort @run', async () => {
    const controller = new AbortController();
    const signal = controller.signal;
    const fetcher = getFetcher('playwright', { loadWait: 1, signal });

    const start = (new Date()).getTime();
    const gen = await fetcher.fetch('https://example.com');
    const docPromise = gen.next();
    setTimeout(() => controller.abort(), 1);
    const doc = (await docPromise).value;
    const took = (new Date()).getTime() - start;
    gen.return();

    assert.ok(!doc);
    assert.ok(took < 500);
  });

});
