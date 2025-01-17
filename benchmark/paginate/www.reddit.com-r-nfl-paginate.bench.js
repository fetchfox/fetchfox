import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkIncreasingSize } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('paginate www.reddit.com/r/nfl/', async function () {
  const matrix = standardMatrix(
    {
      fetcher: [['playwright', { headless: false }]],
    },
    {
      useCdp: false,
    },
  );

  const wf = await fox.init('https://www.reddit.com/r/nfl/').fetch({ pages: 5 }).plan();

  return itRunMatrix(it, 'paginate www.reddit.com/r/nfl/', wf.dump(), matrix, [checkIncreasingSize], {
    shouldSave: true,
  });
});
