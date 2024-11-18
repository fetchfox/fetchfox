import process from 'node:process';
import { fox } from '../../src/index.js';

describe('testpapersfree.com', function() {
  this.timeout(60 * 1000);

  it('should work', async () => {
    const f = await fox
      .config({
        fetcher: 'playwright',
        diskCache: '/tmp/fetchfox_test',
      });

    const out = await f
      .init('https://www.testpapersfree.com/secondary/sec3/index.php?level=secondary3&year=%25&subject=Pure-Chemistry&type=%25&school=%25&Submit=Show+Test+Papers')
      .fetch()
      // TODO: single string prompt for action
      .action({
        action: 'click',
        query: 'download testpaper buttons',
        selector: 'input[type="submit"],button',
      })
      .extract('exam PDF filename, limit 3')
      .schema({ filename: 'the pdf filename' })
      .run(null, (partial) => {
        const { item, index } = partial.delta;
      });

    // TODO: asserts
  });
});
