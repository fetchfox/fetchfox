import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkIncreasingSize } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('paginate chosenmasters.com/charts', async function() {
  const matrix = standardMatrix({
    fetcher: ['playwright'],
  });

  const wf = await fox
    .init('https://chosenmasters.com/charts')
    .fetch({ maxPages: 5 })
    .plan();

  return itRunMatrix(
    it,
    'paginate chosenmasters.com/charts',
    wf.dump(),
    matrix,
    [
      checkIncreasingSize,
    ],
    { shouldSave: true });
});
