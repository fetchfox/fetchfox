import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsExact } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('paginate danbooru.donmai.us', async function() {
  const matrix = standardMatrix({
    fetcher: [['playwright', { headless: false }]],  // This page only loads with headful
  });

  const expected = [
    { _sourceUrl: 'https://danbooru.donmai.us/' },
    { _sourceUrl: 'https://danbooru.donmai.us/posts?page=2' },
    { _sourceUrl: 'https://danbooru.donmai.us/posts?page=3' },
    { _sourceUrl: 'https://danbooru.donmai.us/posts?page=4' },
    { _sourceUrl: 'https://danbooru.donmai.us/posts?page=5' },
  ];

  const wf = await fox
    .init('https://danbooru.donmai.us/')
    .fetch({ pages: 5 })
    .plan();

  return itRunMatrix(
    it,
    'paginate danbooru.donmai.us',
    wf.dump(),
    matrix,
    [
      (items) => checkItemsExact(items, expected, ['_sourceUrl']),
    ],
    { shouldSave: true });
});
