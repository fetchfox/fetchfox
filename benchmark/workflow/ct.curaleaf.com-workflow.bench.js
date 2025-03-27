import * as cheerio from 'cheerio';
import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkAtLeast } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('workflow ct.curaleaf.com', async function() {
  const matrix = standardMatrix();

  const limit = 100;
  const wf = await fox
    .init('https://ct.curaleaf.com/shop/connecticut/curaleaf-ct-stamford/categories/flower')
    .extract({
      questions: {
        product_name: "name of the product being sold",
        product_weight: "weight of the product usually in grams ",
        product_strength: "percentages of THC / CBD",
        product_description: "answers the question, what is being sold? for example sour diesel",
        product_strain: "hybrid, indica, or sativa",
        product_price: "the cost of the flower product in dollars"
      },
      maxPages: 10,
      mode: 'multiple',
    })
    .limit(limit)
    .plan();

  return itRunMatrix(
    it,
    'workflow ct.curaleaf.com',
    wf.dump(),
    matrix,
    [
      (items) => {
        console.log('items', items);
        return checkAtLeast(items, limit)
      }
    ],
    { shouldSave: true });
});
