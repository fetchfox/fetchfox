import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsExact } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('paginate smithery.ai', async function() {
  const matrix = standardMatrix();

  const wf = await fox
    .init('https://smithery.ai/?q=agent')
    .fetch({ maxPages: 5 })
    .plan();

  const expected = [
    { url: 'https://smithery.ai/?q=agent' },
    { url: 'https://smithery.ai/?q=agent&page=2' },
    { url: 'https://smithery.ai/?q=agent&page=3' },
    { url: 'https://smithery.ai/?q=agent&page=4' },
    { url: 'https://smithery.ai/?q=agent&page=5' },
  ];

  return itRunMatrix(
    it,
    'paginate smithery.ai', 
    wf.dump(),
    matrix,
    [
      (items) => checkItemsExact(items, expected, ['url']),
    ],
    { shouldSave: true });
});
