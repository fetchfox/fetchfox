import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkAtLeast } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('crawl medium.com/*/*', async function() {
  const matrix = standardMatrix();

  const limit = 20;

  const wf = await fox
    .init('https://medium.com/*/*')
    .crawl({ prompt: 'look for blog posts', pull: true })
    .limit(limit)
    .plan();

  itRunMatrix(
    it,
    'crawl medium.com/*/*',
    wf.dump(),
    matrix,
    [
      (items) => checkAtLeast(items, limit),
    ],
    { shouldSave: true });
});
