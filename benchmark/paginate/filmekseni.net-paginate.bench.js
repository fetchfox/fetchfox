// TODO: 
import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsExact } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('paginate filmekseni.net', async function() {
  const matrix = standardMatrix({
    fetcher: [
      'playwright',

      // [
      //   'playwright',
      //   { headless: false },  // This page only loads with headful mode
      // ], 
    ],
  });

  const expected = [
    { _sourceUrl: 'https://filmekseni.net/oyuncu/michael-jai-white/' },
    { _sourceUrl: 'https://filmekseni.net/oyuncu/michael-jai-white/page/2/' },
  ]

  const wf = await fox
    .init('https://filmekseni.net/oyuncu/michael-jai-white/')
    .fetch({ pages: 5 })
    .plan();

  return itRunMatrix(
    it,
    'paginate filmekseni.net', 
    wf.dump(),
    matrix,
    [
      (items) => checkItemsExact(items, expected, ['_sourceUrl']),
    ],
    { shouldSave: true });
});
