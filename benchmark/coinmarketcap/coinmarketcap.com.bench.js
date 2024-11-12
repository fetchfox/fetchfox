import os from 'os';
import assert from 'assert';
import { fox } from '../../src/index.js';
import { matrix } from '../lib.js';

describe('coinmarketcap.com', function() {
  this.timeout(5 * 60 * 1000);

  it('should crawl for coins @bench', async () => {
    const configs = matrix();
    console.log('configs', configs);

    for (const config of configs) {
      const wf = await fox
        .config({ 
          diskCache: os.tmpdir() + '/fetchfox-test-cache',
          ...config,
        })
        .plan({
          url: 'https://ffcloud.s3.us-west-2.amazonaws.com/testdata/coinmarketcap.html',
          prompt: 'find lnks to pages about coins, and get their basic market data, including 24 hour trading volume',
        });

      console.log('wf', JSON.stringify(wf.dump(), null, 2));

      // Verify it goes const -> crawl -> extract, and remove extract step
      assert.equal(wf.steps[1].name(), 'crawl');
      assert.equal(wf.steps.length, 3);
      wf.steps.pop();

      wf.steps[1].limit = 50;

      const out = await wf.run();
      const links = out.full[1];

      console.log(links);
      for (let { url } of links.items) {
        url = url.replace(
          'https://ffcloud.s3.us-west-2.amazonaws.com/',
          'https://coinmarketcap.com/');
        console.log('Found url:', url, '\tusing', config.ai);
      }

      // somehow verify the links are correct:
      // - in this case, they should all have format like:
      //   https://coinmarketcap.com/currencies/...
    }
  });

});
