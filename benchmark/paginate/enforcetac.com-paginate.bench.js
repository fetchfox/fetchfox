import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkIncreasingSize } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('paginate enforcetac.com', async function() {
  const matrix = standardMatrix();

  const wf = await fox
    .init('https://www.enforcetac.com/de-de/aussteller-produkte/aussteller-finden')
    .fetch({ maxPages: 5 })
    .plan();

  return itRunMatrix(
    it,
    'paginate enforcetac.com',
    wf.dump(),
    matrix,
    [
      (items) => checkIncreasingSize(items, 5),
    ],
    { shouldSave: true });
});
