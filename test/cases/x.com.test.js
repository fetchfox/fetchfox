import os from 'os';
import process from 'node:process';
import { fox } from '../../src/index.js';

process.on('unhandledRejection', async (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  process.exit(1);
});

describe('x.com', function() {
  this.timeout(0);

  it('should work', async () => {
    const url = 'https://x.com/i/flow/login';

    const out = await fox
      .config({
        actor: [
          'playwright',
          { headless: false, timeoutWait: 10000, loadWait: 2000 }],
        fetcher: ['actor'],
        diskCache: os.tmpdir() + '/fetchfox-test-cache',
      })
      .init(url)
      .login({
        username: 'reply1475',
        password: '123123123aA!',
      })
      .run();

      // .login({
      //   username: 'marcell.ortutay@gmail.com',
      //   password: '123123123aA!',
      // })
      // .fetch({ scroll: 5, scrollWait: 500 })
  });
});
