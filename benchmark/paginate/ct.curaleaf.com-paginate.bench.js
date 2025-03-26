import * as cheerio from 'cheerio';
import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkAtLeast } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('paginate ct.curaleaf.com', async function() {
  const matrix = standardMatrix({
    extractor: ['author'],
  });

  {
    const expected = [
      'https://ct.curaleaf.com/shop/connecticut/curaleaf-ct-stamford/categories/flower',
      'https://ct.curaleaf.com/shop/connecticut/curaleaf-ct-stamford/categories/flower?page=2',
      'https://ct.curaleaf.com/shop/connecticut/curaleaf-ct-stamford/categories/flower?page=3',
      'https://ct.curaleaf.com/shop/connecticut/curaleaf-ct-stamford/categories/flower?page=4',
      'https://ct.curaleaf.com/shop/connecticut/curaleaf-ct-stamford/categories/flower?page=5',
    ]

    const wf = await fox
      .init('https://ct.curaleaf.com/shop/connecticut/curaleaf-ct-stamford/categories/flower')
      .fetch({ maxPages: 5 })
      .plan();

    itRunMatrix(
      it,
      'paginate ct.curaleaf.com (pages)',
      wf.dump(),
      matrix,
      [
        (items) => checkItemsExact(items, expected, ['url']),
      ],
      { shouldSave: true });
  }

  {
    const limit = 100;
    const wf = await fox
      .init('https://ct.curaleaf.com/shop/connecticut/curaleaf-ct-stamford/categories/flower')
      .extract({
        questions: {
          url: 'What is the URL of the product (flower)?'
        },
        mode: 'auto',
        maxPages: 10,
      })
      .limit(limit)
      .plan();

    itRunMatrix(
      it,
      'paginate ct.curaleaf.com (items)',
      wf.dump(),
      matrix,
      [
        (items) => {
          console.log('items', items);
          return checkAtLeast(items, limit);
        }
      ],
      { shouldSave: true });
  }
});
