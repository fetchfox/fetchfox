import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsExact } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('paginate ebay.com nike search', async function() {
  const matrix = standardMatrix();

  const wf = await fox
    .init('https://www.ebay.com/sch/i.html?_nkw=nike+sneakers')
    .fetch({ maxPages: 5 })
    .plan();

  const expected = [
    { url: 'https://www.ebay.com/sch/i.html?_nkw=nike+sneakers' },
    { url: 'https://www.ebay.com/sch/i.html?_nkw=nike+sneakers&_pgn=2' },
    { url: 'https://www.ebay.com/sch/i.html?_nkw=nike+sneakers&_pgn=3' },
    { url: 'https://www.ebay.com/sch/i.html?_nkw=nike+sneakers&_pgn=4' },
    { url: 'https://www.ebay.com/sch/i.html?_nkw=nike+sneakers&_pgn=5' },
  ];

  return itRunMatrix(
    it,
    'paginate ebay.com nike search', 
    wf.dump(),
    matrix,
    [
      (items) => checkItemsExact(items, expected, ['url']),
    ],
    { shouldSave: true });
});
