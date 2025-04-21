import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkAtLeast } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('crawl rvtrader.com/listing/*', async function() {
  const matrix = standardMatrix();

  const limit = 200;

  const wf = await fox
    .init('https://www.rvtrader.com/listing/*')
    .crawl({
      maxIterations: 50,
      suggestions: [
        'https://www.rvtrader.com/research/about/sitemap',
      ]
    })
    .limit(limit)
    .plan();

  itRunMatrix(
    it,
    'crawl rvtrader.com/listing/*',
    wf.dump(),
    matrix,
    [
      (items) => {
        for (const it of items) {
          console.log(it.url);
        }
        return checkAtLeast(items, limit);
      }
    ],
    { shouldSave: true });
});
