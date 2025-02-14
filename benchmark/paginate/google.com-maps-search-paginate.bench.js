import { fox } from '../../src/index.js';
import { itRunMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkAtLeast } from '../lib/checks.js';

describe('paginate google.com maps restaurants search', async function() {
  const matrix = standardMatrix();

  const wf = await fox
    .init('https://www.google.com/maps/search/Restaurants/@42.3233141,-71.162825,14z/')
    .fetch({ maxPages: 5 })
    .extract({ name: 'What is the name of the restaurant?' })
    .plan();

  return itRunMatrix(
    it,
    'paginate google.com maps restaurants search',
    wf.dump(),
    matrix,
    [
      // When you scroll down, previous elements are removed from the page,
      // so just check that we got at least a couple results from each page
      (items) => checkAtLeast(items, 10),
    ],
    { shouldSave: true }
  );
});
