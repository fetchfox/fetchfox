import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkAtLeast } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('paginate www.reddit.com/r/nfl/', async function() {
  const matrix = standardMatrix();

  const limit = 100;

  const wf = await fox
    .init('https://www.reddit.com/r/nfl/')
    .extract({
      questions: {
        url: 'URL of the comment thread',
      },
      maxPages: 10,
    })
    .limit(limit)
    .plan();

  return itRunMatrix(
    it,
    'paginate www.reddit.com/r/nfl/', 
    wf.dump(),
    matrix,
    [
      (items) => checkAtLeast(items, limit),
    ],
    { shouldSave: true });
});
