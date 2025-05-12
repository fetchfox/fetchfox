import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkAtLeast } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('crawl cos.com', async function() {
  const matrix = standardMatrix();

  const limit = 5000;

  const wf = await fox
    .init('https://www.cos.com/')
    .crawl({
      query: 'https://www.cos.com/en_usd/*/product.*',
      maxIterations: 5000,
      suggestions: [
        // 'https://www.cos.com/en.pages.0.xml',
        // 'https://www.cos.com/en.product.0.xml',
      ],
      limit,
    })
    .plan();

  itRunMatrix(
    it,
    'crawl cos.com',
    wf.dump(),
    matrix,
    [
      (items) => checkAtLeast(items, limit),
    ],
    { shouldSave: true });
});
