import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkExcludeUrls } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('crawl en.wikipedia.org/wiki/List_of_presidents_of_the_United_States', async function() {
  const matrix = standardMatrix({
    prompt: [
      'first 5 presidents',
      'find the first 5 presidents',
    ],
  });

  const expected = [
    'https://en.wikipedia.org/wiki/George_Washington',
    'https://en.wikipedia.org/wiki/John_Adams',
    'https://en.wikipedia.org/wiki/Thomas_Jefferson',
    'https://en.wikipedia.org/wiki/James_Madison',
    'https://en.wikipedia.org/wiki/James_Monroe',
  ];

  const wf = await fox
    .init('https://en.wikipedia.org/wiki/List_of_presidents_of_the_United_States')
    .crawl({ query: '{{prompt}}' })
    .limit(5)
    .plan();

  return itRunMatrix(
    it,
    'crawl en.wikipedia.org/wiki/List_of_presidents_of_the_United_States',
    wf.dump(),
    matrix,
    [
      (items) => {
        const score = [0, 0];

        for (const item of items) {
          score[1]++;
          const url = item.url || item._url;
          if (!expected.includes(url)) continue;
          score[0]++;
        }

        return score;
      },
    ],
    { shouldSave: true });
});
