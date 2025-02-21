import os from 'os';
import fs from 'fs';
import assert from 'assert';
import process from 'node:process';
import { fox } from '../../src/index.js';
import { testCache, setTestTimeout } from '../lib/util.js';

describe('github.com', function() {

  setTestTimeout(this, 5 * 1000);

  it('should do basic scrape @fast', async () => {
    let countPartials = 0;
    const wf = await fox
      .config({
        cache: testCache(),
        ai: 'openai:gpt-4o',
        fetcher: [
          'playwright',
          { headless: true, loadWait: 1000, interval: 1000, intervalCap: 1 },
        ],
      })
      .init('https://github.com/bitcoin/bitcoin/commits/master')
      .crawl({
        query: 'find urls of commits, format: https://github.com/bitcoin/bitcoin/commit/...',
      })
      .extract({
        questions: {
          url: 'commit URL, full absolute URL',
          hash: 'commit hash',
          author: 'commit author',
          loc: 'loc changed, NUMBER only',
        },
        single: true,
      })
      .limit(5);

    const out = await wf
      .run(null, (partial) => {
        const { item, results } = partial;
        countPartials++;
      });

    assert.equal(out.items.length, 5);

    let locTotal = 0;
    for (const item of out.items) {
      assert.ok(item.hash.match(/[0-9a-f]{7}/), 'hash hex');
      let loc = parseInt(item.loc);
      if (!isNaN(loc)) {
        locTotal += loc;
      }
    }

    assert.ok(locTotal >= 10, 'loc total');

    wf.abort();
  });

});
