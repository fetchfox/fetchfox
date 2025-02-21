import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkIncreasingSize } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('www.enforcetac.com', async function() {
  const matrix = standardMatrix();

  const wf = await fox
    .init('https://www.enforcetac.com/de-de/aussteller-produkte/aussteller-finden')
    .action({
      commands: [
        { prompt: 'accept cookies if necessary (optional)' },
        { prompt: 'scroll down to the bottom of the page to paginate', limit: 5 },
      ]
    })
    .plan();

  return itRunMatrix(
    it,
    'should accept cookies and paginate',
    wf.dump(),
    matrix,
    [
      (items) => checkIncreasingSize(items, 5),
    ],
    { shouldSave: true });
});
