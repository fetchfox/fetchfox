import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkIncreasingSize } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('paginate steimatzky.co.il', async function() {
  const matrix = standardMatrix();

  const wf = await fox
    .init('https://www.steimatzky.co.il/%D7%A1%D7%A4%D7%A8%D7%99%D7%9D/%D7%A4%D7%A2%D7%95%D7%98%D7%95%D7%AA-%D7%95%D7%99%D7%9C%D7%93%D7%99%D7%9D?p=3&product_list_order=name')
    .fetch({ maxPages: 5 })
    .plan();

  return itRunMatrix(
    it,
    'paginate steimatzky.co.il',
    wf.dump(),
    matrix,
    [
      (items) => checkIncreasingSize(items, 5),
    ],
    { shouldSave: true });
});
