import { fox } from '../../src/index.js';
import { itRunMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkIncreasingSize } from '../lib/checks.js';

const profileId = '9b1d1968-5ced-45af-bba5-90516068e128';
const host = 'localhost:8848';
const apiKey = '212b66a6-9129-4cf4-88c2-3b6c9a325523';
const config = {
  headless: true,
  autoClose: true,
};
const query = new URLSearchParams({
  'x-api-key': apiKey, // required
  config: encodeURIComponent(JSON.stringify(config)),
});
const cdp = `ws://${host}/devtool/launch/${profileId}?${query.toString()}`;

describe('paginate google.com maps restaurants search', async function() {
  const matrix = standardMatrix({
    fetcher: [
      ['playwright', { headless: false, cdp }],
    ]
  });

  const wf = await fox
    .init('https://www.google.com/maps/search/Restaurants/@42.3233141,-71.162825,14z/')
    // .fetch({ maxPages: 5 })
    .fetch({ maxPages: 2 })
    .plan();

  return itRunMatrix(
    it,
    'paginate google.com maps restaurants search',
    wf.dump(),
    matrix,
    [
      checkIncreasingSize,
    ],
    { shouldSave: true }
  );
});
