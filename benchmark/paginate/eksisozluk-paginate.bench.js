import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsExact } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('paginate eksisozluk', async function () {
  const matrix = standardMatrix({
    fetcher: [
      [
        'playwright',
        { headless: false }, // This page only loads with headful mode
      ],
    ],
  });

  const expected = [
    { _sourceUrl: 'https://eksisozluk.com/halki-terorist-ilan-etme-cureti--6531818' },
    { _sourceUrl: 'https://eksisozluk.com/halki-terorist-ilan-etme-cureti--6531818?p=2' },
  ];

  const wf = await fox
    .init('https://eksisozluk.com/halki-terorist-ilan-etme-cureti--6531818')
    .fetch({ pages: 5 })
    .plan();

  return itRunMatrix(
    it,
    'paginate eksisozluk',
    wf.dump(),
    matrix,
    [(items) => checkItemsExact(items, expected, ['_sourceUrl'])],
    { shouldSave: true },
  );
});
