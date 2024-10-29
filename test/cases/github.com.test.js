import os from 'os';
import fs from 'fs';
import assert from 'assert';
import process from 'node:process';
import { fox } from '../../src/index.js';

process.on('unhandledRejection', async (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  process.exit(1);
});

describe('github.com', function() {
  this.timeout(5 * 60 * 1000);

  it('should do basic scrape', async () => {
    let countPartials = 0;
    const out = await fox
      .config({ diskCache: os.tmpdir() + '/fetchfox-test-cache' })
      .init('https://github.com/bitcoin/bitcoin/commits/master')
      .crawl({
        query: 'find urls of commits, format: https://github.com/bitcoin/bitcoin/commit/...',
        limit: 10,
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
      .run(null, (partial) => {
        const { item, results } = partial;
        countPartials++;
      });

    // Sanity checks
    assert.equal(countPartials, 10);
    assert.equal(out.items.length, 10);

    let locTotal = 0;
    for (const item of out.items) {
      assert.ok(item.hash.match(/[0-9a-f]{7}/), 'hash hex');
      let loc = parseInt(item.loc);
      if (!isNaN(loc)) {
        locTotal += loc;
      }
    }

    assert.ok(locTotal >= 10, 'loc total');
  });

  it('should do complex scrape', async () => {
    let countPartials = 0;
    const out = await fox
      .config({ diskCache: os.tmpdir() + '/fetchfox-test-cache' })
      .init('https://github.com/bitcoin/bitcoin/commits/master')
      .crawl('find urls commits, limit: 10')
      .extract({
        url: 'commit URL',
        hash: 'commit hash',
        author: 'commit author',
        loc: 'loc changed, NUMBER only',
      })
      .filter('commits that changed at least 10 lines')
      .crawl('get URL of the author github profile. MUST match pattern: https://github.com/[username]')
      // .extract('get username and repos they commit to')
      // .schema({ username: 'username', repos: ['array of repos'] })
      .run(null, (partial) => {
        const { item, results } = partial;
        countPartials++;
      });

  });
});
