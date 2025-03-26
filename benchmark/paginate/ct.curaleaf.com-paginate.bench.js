import * as cheerio from 'cheerio';
import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkAtLeast } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('paginate ct.curaleaf.com', async function() {
  const matrix = standardMatrix();

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

  return itRunMatrix(
    it,
    'paginate ct.curaleaf.com',
    wf.dump(),
    matrix,
    [
      (items) => checkAtLeast(limit)
    ],
    { shouldSave: true });
});
