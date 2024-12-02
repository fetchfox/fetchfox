import assert from 'assert';
import os from 'os';
import { DeepCrawler, DiskCache } from '../../src/index.js';

describe('DeepCrawler', function() {
  this.timeout(3 * 60 * 1000);

  it('should deep crawl', async () => {
    const cache = new DiskCache('/tmp/ff-dc');

    const dc = new DeepCrawler({ cache });

    const stream = dc.run(
      'https://skidheaven.com/',
      'products',
      {
        name: 'Product name',
        sku: 'Product sku',
        price: 'Product price',
      });

    for await (const r of stream) {
      console.log('===>', r);
    }
  });

});
