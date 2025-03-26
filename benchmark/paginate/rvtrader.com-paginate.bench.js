import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkAtLeast } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('rvtrader.com', async function() {
  const matrix = standardMatrix();

  const limit = 100;

  const wf = await fox
    .init('https://www.rvtrader.com/Used/rvs-for-sale?condition=U')
    .extract({
      questions: {
        name: 'Name of the RV for sale',
        url: 'URL of the RV for sale',
      },
      maxPages: 10,
    })
    .limit(limit)
    .plan();

  return itRunMatrix(
    it,
    'paginate rvtrader.com', 
    wf.dump(),
    matrix,
    [
      (items) => checkAtLeast(items, limit),
    ],
    { shouldSave: true });
});
