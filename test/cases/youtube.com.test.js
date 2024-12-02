import os from 'os'
import assert from 'assert';
import process from 'node:process';
import { logger } from '../../src/log/logger.js';
import { fox } from '../../src/index.js';

describe('youtube.com', function() {
  this.timeout(5 * 60 * 1000);

  it('should work', async () => {
    const url = 'https://www.youtube.com/watch?v=u6aEYuemt0M';

    let count = 0;

    const out = await fox
      .config({
        actor: [
          'playwright',
          { headless: false, timeoutWait: 10000, loadWait: 2000 }],
        fetcher: ['actor'],
        diskCache: os.tmpdir() + '/fetchfox-test-cache',
      })
      .init(url)
      .fetch({ scroll: 5, scrollWait: 500 })
      .extract({
        username: 'comment poster username',
        commentText: 'text of the comment',
        upvotes: 'number of upvotes for the comment',
      })
      .unique('commentText')
      .limit(50)
      .run(
        null,
        (partial) => {
          count++;
          console.log(`Item ${count}:`, partial.item);
        });
  });

});
