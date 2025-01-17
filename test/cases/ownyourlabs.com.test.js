import os from 'os';
import fs from 'fs';
import assert from 'assert';
import process from 'node:process';
import { fox } from '../../src/index.js';
import { testCache } from '../lib/util.js';

describe('ownyourlabs.com', function () {
  this.timeout(5 * 60 * 1000);

  it('should work @run', async () => {
    let countPartials = 0;
    const out = await fox
      .config({ cache: testCache() })
      .init('https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/jb5ym2yq47/https-ownyourlabs-com-shop-oyl-.html')
      .extract({
        product_name: 'What is the name of this product?',
        price: 'What is the price of this product? Format: $XX.XX',
      })
      .limit(20)
      .run();

    assert.equal(out.items.length, 20);
  });
});
