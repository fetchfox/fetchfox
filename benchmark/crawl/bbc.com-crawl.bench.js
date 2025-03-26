import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkExcludeUrls } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('crawl bbc.com', async function() {
  const matrix = standardMatrix({
    prompt: [
      'articles',
      'BBC news articles',
      'find links to BBC news articles',
    ],
  });

  const wf = await fox
    .init('https://www.bbc.com/')
    .crawl({ query: '{{prompt}}' })
    .limit(40)
    .plan();

  return itRunMatrix(
    it,
    'crawl bbc.com',
    wf.dump(),
    matrix,
    [
      (items) => {
        const score = [0, 0];

        for (const item of items) {
          score[1]++;
          const url = item.url || item._url;
          if (!url) continue;
          if (!url.match(/^https:\/\/www\.bbc\.(com|co.uk)\/\w+\/articles?\//)) continue;
          score[0]++;
        }

        return score;
      },
    ],
    { shouldSave: true });
});
