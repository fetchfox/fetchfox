import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkAtLeast } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('paginate x.com', async function() {
  const matrix = standardMatrix();

  const wf = await fox
    .init('https://x.com/elonmusk')
    .fetch({ maxPages: 10 })
    .extract({
      text: 'Post text',
    })
    .unique('text')
    .plan();

  return itRunMatrix(
    it,
    'paginate x.com',
    wf.dump(),
    matrix,
    [
      (items) => checkAtLeast(items, 5),
    ],
    { shouldSave: true });
});
