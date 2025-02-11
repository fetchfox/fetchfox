import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsExact } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('paginate news.ycombinator.com/news', async function() {
  const matrix = standardMatrix({
    fetcher: ['playwright'],
  });

  const expected = [
    { url: 'https://news.ycombinator.com/news' },
    { url: 'https://news.ycombinator.com/news?p=2' },
    { url: 'https://news.ycombinator.com/news?p=3' },
    { url: 'https://news.ycombinator.com/news?p=4' },
    { url: 'https://news.ycombinator.com/news?p=5' },
  ];

  const wf = await fox
    .init('https://news.ycombinator.com/news')
    .fetch({ maxPages: 5 })
    .plan();

  return itRunMatrix(
    it,
    'paginate news.ycombinator.com/news', 
    wf.dump(),
    matrix,
    [
      (items) => checkItemsExact(items, expected, ['url']),
    ],
    { shouldSave: true });
});
