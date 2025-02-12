import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkExcludeUrls } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('crawl slashdot.org', async function() {
  const matrix = standardMatrix({
    prompt: [
      'articles',
      'all slashdot stories',
      'links to news articles',
    ],
  });

  const wf = await fox
    .init('https://slashdot.org/')
    .crawl({ query: '{{prompt}}' })
    .limit(40)
    .plan();

  return itRunMatrix(
    it,
    'crawl slashdot.org',
    wf.dump(),
    matrix,
    [
      (items) => {
        const score = [0, 0];

        for (const item of items) {
          score[1]++;
          const url = item.url || item._url;
          if (!url) continue;
          if (!url.match(/^https:\/\/\w+\.slashdot\.org\/story\/(\d+\/){4}[a-zA-Z-]+/)) continue;
          score[0]++;
        }

        return score;
      },
    ],
    { shouldSave: true });
});
