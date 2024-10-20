import process from 'node:process';
import { fox } from '../../src/index.js';

process.on('unhandledRejection', async (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  process.exit(1);
  // throw 'xyz';
  // throw new Error(p);
  // application specific logging, throwing an error, or other logic here
});

describe('testpapersfree.com', function() {
  this.timeout(0);

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
        query: 'download testpaper buttons.',
        selector: 'input[type=submit],button',
      })
      .extract('exam PDF filename')
      .run();
  });
});