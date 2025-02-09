import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsExact } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('paginate uhrforum.de', async function() {
  const matrix = standardMatrix();

  const expected = [
    { url: 'https://uhrforum.de/forums/angebote.11/' },
    { url: 'https://uhrforum.de/forums/angebote.11/page-2' },
    { url: 'https://uhrforum.de/forums/angebote.11/page-3' },
    { url: 'https://uhrforum.de/forums/angebote.11/page-4' },
    { url: 'https://uhrforum.de/forums/angebote.11/page-5' },
  ];

  const wf = await fox
    .init('https://uhrforum.de/forums/angebote.11/')
    .fetch({ maxPages: 5 })
    .plan();

  return itRunMatrix(
    it,
    'paginate uhrforum.de',
    wf.dump(),
    matrix,
    [
      (items) => checkItemsExact(items, expected, ['url']),
    ],
    { shouldSave: true });
});
