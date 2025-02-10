import { fox } from '../../src/index.js';
import { itRunMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkIncreasingSize } from '../lib/checks.js';

describe('paginate google.com maps restaurants search', async function() {
  const matrix = standardMatrix();

  const wf = await fox
    .init('https://www.google.com/maps/search/Restaurants/@42.3233141,-71.162825,14z/')
    .fetch({ maxPages: 5 })
    .plan();

  return itRunMatrix(
    it,
    'paginate google.com maps restaurants search',
    wf.dump(),
    matrix,
    [
      (items) => checkIncreasingSize(items, 2),
    ],
    { shouldSave: true }
  );
});
