import os from 'os';
import assert from 'assert';
import process from 'node:process';
import { fox } from '../../../src/index.js';

process.on('unhandledRejection', async (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  process.exit(1);
});

describe('unitedskidtracks.com', function() {
  this.timeout(5 * 60 * 1000);

  it('should scrape a product @run', async () => {
    const out = await fox
      .config({
        diskCachex: os.tmpdir() + '/fetchfox-test-cache',
        fetcher: [
          'playwright',
          { headless: true },
        ],
      })
      .init([
        'https://unitedskidtracks.com/bobcat/bobcat-t595-sprocket/',
        'https://unitedskidtracks.com/caterpillar/caterpillar-249d3-track-bar/',
      ])
      .extract({
        questions: {
          name: 'product name',
          sku: 'product sku',
          price: 'product price. if there is a range, include both. format: "Number" or "Number - Number"',
          price_low: 'product price. if there is a range, pick the low end. format: Number',
          price_high: 'if the page has a price range, pick the high end. If no range, return empty string. format: Number',
        },
        single: true,
      })
      .run();

    const sorted = out.items.sort((a, b) => a.name.localeCompare(b.name));

    assert.equal(sorted[0].name, 'Bobcat T595 Sprocket');
    assert.equal(sorted[0].sku, 'BTT595 SP-15F15');
    assert.equal(sorted[0].price, '235');
    assert.equal(sorted[0].price_low, '235');
    assert.equal(sorted[0].price_high, '');

    assert.equal(sorted[1].name, 'Caterpillar 249D3 Track - Bar');
    assert.equal(sorted[1].sku, '(not found)');
    assert.equal(sorted[1].price, '995 - 1175');
    assert.equal(sorted[1].price_low, '995');
    assert.equal(sorted[1].price_high, '1175');
  });
});
