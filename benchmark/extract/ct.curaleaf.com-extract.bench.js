import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('extract ct.curaleaf.com', async function() {
  const matrix = standardMatrix();

  const cases = [
    {
      name: 'page 1',
      url: 'https://ct.curaleaf.com/shop/connecticut/curaleaf-ct-stamford/categories/flower',
      expected: [],
    },
  ];

  for (const { name, url, expected } of cases) {
    const wf = await fox
      .init(url)
      .extract({
        questions: {
          product_name: 'name of the product being sold',
          product_weight: 'weight of the product usually in grams ',
          product_strength: 'percentages of THC / CBD',
          product_description: 'answers the question, what is being sold? for example sour diesel',
          product_strain: 'hybrid, indica, or sativa',
          product_price: 'the cost of the flower product in dollars'
        },
        mode: 'multiple',
        view: 'html',
      })
      .limit(25)
      .plan();

    await itRunMatrix(
      it,
      `extract ct.curaleaf.com (${name})`,
      wf.dump(),
      matrix,
      [
        // (items) => checkItemsAI(items, expected, ['comment_text', 'comment_author']),
        (items) => {
          console.log('items', items);
        }
      ],
      { shouldSave: true });
  }
});
