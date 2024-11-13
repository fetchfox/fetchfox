import process from 'node:process';
import { fox } from '../../src/index.js';

describe('sgtestpapersfree.com', function() {
  this.timeout(60 * 1000);

  it('should work', async () => {
    const f = await fox
      .config({
        fetcher: 'playwright',
        diskCache: '/tmp/fetchfox_test_2',
      });

    const out = await f
      .init('https://www.sgtestpapersfree.com/')
      .fetch()
      // TODO: single string prompt for action
      .action({
        action: 'click',
        query: 'Buttons that contains "Primary"',
        selector: 'a.btn',
      })
      .extract('exam PDF filenames from "View" buttons. find ALL results, limit: 10')
      .schema({ filename: 'pdf filename' })
      .run(null, (partial) => {
        const { item, index } = partial.delta;
      });

    // TODO: verify
  });
});
