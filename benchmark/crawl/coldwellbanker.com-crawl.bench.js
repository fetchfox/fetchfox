import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkAtLeast } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('crawl coldwellbanker.com', async function() {
  const matrix = standardMatrix();

  const limit = 100;

  const wf = await fox
    .init('https://www.coldwellbanker.com/*/*/agents/*')
    .crawl({
      suggestions: ['https://www.coldwellbanker.com/sitemap/agents'],
    })
    .limit(limit)
    .plan();

  itRunMatrix(
    it,
    'crawl coldwellbanker.com',
    wf.dump(),
    matrix,
    [
      (items) => checkAtLeast(items, limit),
    ],
    { shouldSave: true });
});
