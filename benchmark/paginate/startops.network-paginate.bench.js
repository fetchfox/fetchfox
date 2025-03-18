import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkIncreasingSize } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('startops.network', async function() {
  const matrix = standardMatrix({
    fetcher: [
      [
        'playwright',
        {
          headless: false,
        }
      ]
    ]
  });

  const wf = await fox
    .init('https://startops.network/lists')
    .extract({
      questions: {
        list_title: 'What is the title of the list?',
        url: 'What is the URL of the detail page? Format: Absolute URL'
      },
      hint: 'infinite scroll pagination, scroll to the bottom for next page',
      mode: 'multiple',
      view: 'html',
      maxPages: 10
    })
    .plan();

  return itRunMatrix(
    it,
    'should paginate startops.network',
    wf.dump(),
    matrix,
    [
      (items) => {
        // There should be at least 50 results
        return [Math.min(items.length, 50), 50];
      }
    ],
    { shouldSave: true });
});
