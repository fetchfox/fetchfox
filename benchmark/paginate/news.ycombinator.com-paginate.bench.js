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
    { _sourceUrl: 'https://news.ycombinator.com/news' },
    { _sourceUrl: 'https://news.ycombinator.com/news?p=2' },
    { _sourceUrl: 'https://news.ycombinator.com/news?p=3' },
    { _sourceUrl: 'https://news.ycombinator.com/news?p=4' },
    { _sourceUrl: 'https://news.ycombinator.com/news?p=5' },
  ];

  const wf = await fox
    .init('https://news.ycombinator.com/news')
    .fetch({ pages: 5 })
    .plan();

  return itRunMatrix(
    it,
    'paginate news.ycombinator.com/news', 
    wf.dump(),
    matrix,
    [
      (items) => checkItemsExact(items, expected, ['_sourceUrl']),
    ],
    { shouldSave: true });
});
