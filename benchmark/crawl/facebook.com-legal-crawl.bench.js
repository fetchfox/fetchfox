import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkExcludeUrls } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('crawl facebook.com/legal/*', async function() {
  const matrix = standardMatrix();

  const wf = await fox
    .init('https://www.facebook.com')
    .crawl({ query: 'https://www.facebook.com/legal/*' })
    .limit(20)
    .plan();

  itRunMatrix(
    it,
    'crawl facebook.com/legal/*',
    wf.dump(),
    matrix,
    [
      (items) => {
        console.log('items', items);
        return [0, 1];
      },
    ],
    { shouldSave: true });
});
