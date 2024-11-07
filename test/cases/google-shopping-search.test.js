import { logger } from '../../src/log/logger.js';
import assert from 'assert';
import process from 'node:process';
import { fox } from '../../src/index.js';

process.on('unhandledRejection', async (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  process.exit(1);
});

describe('google.com shopping search', function() {
  this.timeout(5 * 60 * 1000);

  it('should scrape 5 product', async () => {

    const url = 'https://ffcloud.s3.us-west-2.amazonaws.com/testdata/google-shopping-search.html';
    const out = await fox
      .init(url)
      .extract({
        product_name:	'What is the name of this product? Format: string',
        product_url: 'What is the URL of this product? Format: full absolute URL',
        product_price: 'What is the price?',
        product_rating: 'What is the rating? Format: X.X/X',
        seller: 'Who is the seller of this product?',
      })
      .limit(5)
      .exportItems({ filepath: '/tmp/out.csv', format: 'csv' })
      .run();

    console.log('out', out);

    // TODO: verify results
  });
});
