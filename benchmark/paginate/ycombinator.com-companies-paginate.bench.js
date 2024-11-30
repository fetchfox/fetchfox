import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkExcludeUrls } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('paginate ycombinator.com/companies', async function() {
  const matrix = standardMatrix({
    fetcher: ['playwright'],
  });

  const wf = await fox
    .init('https://www.ycombinator.com/companies')
    .fetch({ pages: 5 })
    .plan();

  return itRunMatrix(
    it,
    'paginate ycombinator.com/companies',
    wf.dump(),
    matrix,
    [
      // TODO: check pagination
      (items) => {
        const score = [1, 5];

        let last = parseInt(items[0]._sourceSize);
        for (let i = 1; i < items.length; i++) {
          const size = parseInt(items[i]._sourceSize);
          if (size > last + 1000) {
            last = size;
            score[0]++;
          }
        }

        return score;
      },
    ],
    { shouldSave: true });
});
