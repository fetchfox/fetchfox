import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsExact } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('paginate scholarshipamerica', async function() {
  const matrix = standardMatrix({
    fetcher: ['playwright'],
  });

  const expected = [
    { _sourceUrl: 'https://scholarshipamerica.org/students/browse-scholarships/' },
    { _sourceUrl: 'https://scholarshipamerica.org/students/browse-scholarships/?fwp_paged=2' },
    { _sourceUrl: 'https://scholarshipamerica.org/students/browse-scholarships/?fwp_paged=3' },
    { _sourceUrl: 'https://scholarshipamerica.org/students/browse-scholarships/?fwp_paged=4' },
    { _sourceUrl: 'https://scholarshipamerica.org/students/browse-scholarships/?fwp_paged=5' },
  ];

  const wf = await fox
    .init('https://scholarshipamerica.org/students/browse-scholarships/')
    .fetch({ maxPages: 5 })
    .plan();

  return itRunMatrix(
    it,
    'paginate scholarshipamerica',
    wf.dump(),
    matrix,
    [
      (items) => checkItemsExact(items, expected, ['_sourceUrl']),
    ],
    {
      shouldSave: true,
      noCache: true,  // requires live site for JS paging
    });
});
