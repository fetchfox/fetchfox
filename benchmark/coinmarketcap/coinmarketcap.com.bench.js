import os from 'os';
import assert from 'assert';
import { fox } from '../../src/index.js';
import { matrix } from '../lib.js';

describe('coinmarketcap.com', function() {
  this.timeout(5 * 60 * 1000);

  it('should benchmark crawl'), async() => {
    const url = 'https://ffcloud.s3.us-west-2.amazonaws.com/testdata/coinmarketcap.html',
    const queries = [
      'find links to pages about coins',
      'coins',
      'tokens',
      'cryptocurrencies',
      'cryptos',
      'find crypto token pages',
    ];

    for (const query of queries) {
      runCrawlBenchmark(
        {
          url, 
          query,
          include: [
            '/currencies/bitcoin/',
          ],
          includePattern: new RegExp(/\/currencies\//),
          exclude: [
            'https://support.coinmarketcap.com/hc/en-us/articles/4412939497755/',
          ],
        });
    }
  });

});
