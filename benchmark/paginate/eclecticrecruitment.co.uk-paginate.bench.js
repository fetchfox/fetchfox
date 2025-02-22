import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkIncreasingSize } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('https://www.eclecticrecruitment.co.uk/jobs', async function() {
  const matrix = standardMatrix({
    fetcher: [
      [
        'playwright',
        {
          headless: false,
          timeout: 15 * 1000,
          timeout: 5 * 1000,
        }
      ]
    ]
  });

  const expected = [
    { url: 'https://www.eclecticrecruitment.co.uk/jobs/' },
    { url: 'https://www.eclecticrecruitment.co.uk/jobs/page/2/' },
    { url: 'https://www.eclecticrecruitment.co.uk/jobs/page/3/' },
    { url: 'https://www.eclecticrecruitment.co.uk/jobs/page/4/' },
    { url: 'https://www.eclecticrecruitment.co.uk/jobs/page/5/' },
  ];

  const wf = await fox
    .init('https://www.eclecticrecruitment.co.uk/jobs/')
    .fetch({ maxPages: 5 })
    .plan();

  return itRunMatrix(
    it,
    'should paginate',
    wf.dump(),
    matrix,
    [
      (items) => checkItemsExact(items, expected, ['url']),
    ],
    { shouldSave: true });
});
