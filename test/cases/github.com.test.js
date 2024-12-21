import assert from 'assert';
import { DiskCache, fox } from '../../src/index.js';
import { testCache } from '../lib/util.js';

describe('github.com', function () {
  this.timeout(100 * 1000);

  it('should do basic scrape @run', async () => {
    let countPartials = 0;

    const workflow = fox
      .config({
        cache: new DiskCache('.test-cache'),
        fetcher: ['playwright', { headless: false, loadWait: 1000, interval: 1000, intervalCap: 1 }],
      })
      .init('https://github.com/bitcoin/bitcoin/commits/master')
      .crawl({
        query: 'find urls of commits, format: https://github.com/bitcoin/bitcoin/commit/...',
        maxPages: 100,
      })
      .fetch()
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

    const out = await workflow.run(null, (partial) => {
      const { item, results } = partial;
      countPartials++;
    });

    // Sanity checks
    assert.equal(countPartials, 5);
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
    // workflow.stop();
  });

  it('should do complex scrape @disabled', async () => {
    let countPartials = 0;
    const out = await fox
      .config({
        cache: testCache(),
        fetcher: ['playwright', { headless: true, loadWait: 1000, interval: 1000, intervalCap: 1 }],
      })
      .init('https://github.com/bitcoin/bitcoin/commits/master')
      .crawl({
        query: 'find urls of commits, format: https://github.com/bitcoin/bitcoin/commit/...',
        limit: 20,
      })
      .extract({
        url: 'commit URL',
        hash: 'commit hash',
        author: 'commit author',
        loc: 'loc changed, NUMBER only',
        single: true,
      })
      .filter('commits that changed at least 10 lines')
      .crawl({
        query: 'get URL of the author github profile. MUST match pattern: https://github.com/[username]',
        limit: 20,
      })
      .extract({
        username: 'get username of this profile',
        repos: 'repos they commit to. for repo, ONLY include the the last part of th repo, with no slash',
      })
      .schema({ username: 'username', repos: ['array of repos'] })
      .unique('username')
      .limit(10)
      .run(null, (partial) => {
        const { item, results } = partial;
        countPartials++;
      });

    let hasBitcoin = 0;
    const seen = [];
    assert.ok(out.items.length <= 10);
    assert.ok(out.items.length > 3);
    for (let { username, repos } of out.items) {
      if (username == '(not found)') continue;
      assert.ok(!seen[username]);
      assert.ok(username.match(/^[A-Za-z0-9\-_ ]+$/));
      assert.ok(Array.isArray(repos));
      if (repos.includes('bitcoin')) {
        hasBitcoin++;
      }
    }
    assert.ok(hasBitcoin > 2);
  });
});
