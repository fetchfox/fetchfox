import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsExact } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('paginate catalog.mountainview.gov', async function() {
  const matrix = standardMatrix({
    fetcher: ['playwright'],
  });

  const expected = [
    { _sourceUrl: 'https://catalog.mountainview.gov/Union/Search?view=list&showCovers=on&lookfor=garfield&searchIndex=Keyword&searchSource=local' },
    { _sourceUrl: 'https://catalog.mountainview.gov/Search/Results?lookfor=garfield&searchIndex=Keyword&sort=relevance&page=%d&view=list&searchSource=local&page=2' },
    { _sourceUrl: 'https://catalog.mountainview.gov/Search/Results?lookfor=garfield&searchIndex=Keyword&sort=relevance&page=%d&view=list&searchSource=local&page=3' },
    { _sourceUrl: 'https://catalog.mountainview.gov/Search/Results?lookfor=garfield&searchIndex=Keyword&sort=relevance&page=%d&view=list&searchSource=local&page=4' },
    { _sourceUrl: 'https://catalog.mountainview.gov/Search/Results?lookfor=garfield&searchIndex=Keyword&sort=relevance&page=%d&view=list&searchSource=local&page=5' },
  ];

  const wf = await fox
    .init('https://catalog.mountainview.gov/Union/Search?view=list&showCovers=on&lookfor=garfield&searchIndex=Keyword&searchSource=local')
    .fetch({ pages: 5 })
    .plan();

  return itRunMatrix(
    it,
    'paginate catalog.mountainview.gov', 
    wf.dump(),
    matrix,
    [
      (items) => checkItemsExact(items, expected, ['_sourceUrl']),
    ],
    { shouldSave: true });
});
