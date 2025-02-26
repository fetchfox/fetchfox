import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsExact } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('catalog.mountainview.gov', async function() {
  const matrix = standardMatrix({
    fetcher: ['playwright'],
  });

  const expected = [
    { url: 'https://catalog.mountainview.gov/Union/Search?view=list&showCovers=on&lookfor=garfield&searchIndex=Keyword&searchSource=local' },
    { url: 'https://catalog.mountainview.gov/Search/Results?lookfor=garfield&searchIndex=Keyword&sort=relevance&page=%d&view=list&searchSource=local&page=2' },
    { url: 'https://catalog.mountainview.gov/Search/Results?lookfor=garfield&searchIndex=Keyword&sort=relevance&page=%d&view=list&searchSource=local&page=3' },
    { url: 'https://catalog.mountainview.gov/Search/Results?lookfor=garfield&searchIndex=Keyword&sort=relevance&page=%d&view=list&searchSource=local&page=4' },
    { url: 'https://catalog.mountainview.gov/Search/Results?lookfor=garfield&searchIndex=Keyword&sort=relevance&page=%d&view=list&searchSource=local&page=5' },
  ];

  const wf = await fox
    .init('https://catalog.mountainview.gov/Union/Search?view=list&showCovers=on&lookfor=garfield&searchIndex=Keyword&searchSource=local')
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
