import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkIncreasingSize } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('paginate ycombinator.com/companies', async function () {
  const matrix = standardMatrix({
    fetcher: ['playwright'],
  });

  const wf = await fox.init('https://www.ycombinator.com/companies').fetch({ pages: 5 }).plan();

  return itRunMatrix(it, 'paginate ycombinator.com/companies', wf.dump(), matrix, [checkIncreasingSize], {
    shouldSave: true,
  });
});
