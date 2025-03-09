import { fox } from '../../src/index.js';
import { itRunMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkAtLeast } from '../lib/checks.js';

describe('paginate google.com maps restaurants search', async function() {
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

  const limit = 50;

  const wf = await fox
    .init('https://www.google.com/maps/search/Restaurants/@42.3233141,-71.162825,14z/')
    .extract({
      questions: {
        name: 'What is the name of the restaurant?'
      },
      maxPages: 20,
    })
    .limit(limit)
    .plan();

  return itRunMatrix(
    it,
    'paginate google.com maps restaurants search',
    wf.dump(),
    matrix,
    [
      (items) => checkAtLeast(items, limit),
    ],
    { shouldSave: true }
  );
});
