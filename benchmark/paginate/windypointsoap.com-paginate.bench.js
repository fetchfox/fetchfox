import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkAtLeast } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('windypointsoap.com', async function() {
  const matrix = standardMatrix({
    fetcher: [
      [
        'playwright',
        {
          headless: false,
        }
      ]
    ]
  });

  const limit = 100;

  const wf = await fox
    .init('https://www.windypointsoap.com/collections/fragrance-oils')
    .extract({
      questions: {
        name: 'Name of the product',
        url: 'URL of the product',
      },
      maxPages: 5,
    })
    .limit(limit)
    .plan();

  return itRunMatrix(
    it,
    'paginate windypointsoap.com', 
    wf.dump(),
    matrix,
    [
      (items) => checkAtLeast(items, limit),
    ],
    { shouldSave: true });
});
