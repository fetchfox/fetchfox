import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkExcludeUrls } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('paginate github.com', async function() {
  const matrix = standardMatrix({
    fetcher: ['playwright'],
  });

  const wf = await fox
    .init('https://github.com/fetchfox/fetchfox/commits/master/')
    .fetch({ maxPages: 5 })
    .plan();

  return itRunMatrix(
    it,
    'paginate github.com',
    wf.dump(),
    matrix,
    [
      (items) => {
        const score = [0, 5];

        const first = 'https://github.com/fetchfox/fetchfox/commits/master/';
        if ((items[0] || {})._sourceUrl == first) {
          score[0]++;
        }

        let last = 0;
        for (let i = 1; i < items.length; i++) {
          const item = items[i];
          const url = item._sourceUrl;
          if (url.indexOf(first) == -1) continue;
          const m = url.match(/after=[a-f0-9]+\+([0-9]+)/);
          if (!m) continue;
          const num = parseInt(m[1]);
          if (num > last) {
            last = num;
            score[0]++;
          }
        }

        return score;
      },
    ],
    { shouldSave: true });
});
