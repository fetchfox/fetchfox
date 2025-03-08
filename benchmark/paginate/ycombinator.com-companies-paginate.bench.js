import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkAtLeast } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('paginate ycombinator.com/companies', async function() {
  const matrix = standardMatrix();

  const limit = 100;
  const wf = await fox
    .init('https://www.ycombinator.com/companies')
    .extract({
      questions: {
        name: 'Name of the company',
      },
      maxPages: 10
    })
    .limit(limit)
    .plan();

  return itRunMatrix(
    it,
    'paginate ycombinator.com/companies',
    wf.dump(),
    matrix,
    [
      (items) => checkAtLeast(items, limit)
    ],
    { shouldSave: true });
});
