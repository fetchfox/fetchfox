import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkIncreasingSize } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

const s3 = { bucket: 'ffcloud', acl: 'public-read', region: 'us-west-2' };

describe('paginate producthunt.com', async function() {
  const matrix = standardMatrix();

  const wf = await fox
    .init('https://www.producthunt.com/')
    .fetch({ maxPages: 2 })
    .plan();

  return itRunMatrix(
    it,
    'paginate producthunt.com',
    wf.dump(),
    matrix,
    [
      (items) => checkIncreasingSize(items, 2),
    ],
    { shouldSave: true });
});
