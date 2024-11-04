import process from 'node:process';
import { fox } from '../../src/index.js';

process.on('unhandledRejection', async (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  process.exit(1);
});

describe('sgtestpapersfree.com', function() {
  this.timeout(0);

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
