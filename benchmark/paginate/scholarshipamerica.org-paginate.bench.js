import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('paginate scholarshipamerica.org', async function() {
  const matrix = standardMatrix();

  const expected = [
    { url: 'https://scholarshipamerica.org/students/browse-scholarships/' },
    { url: 'https://scholarshipamerica.org/students/browse-scholarships/?_paged=2' },
    { url: 'https://scholarshipamerica.org/students/browse-scholarships/?_paged=3' },
    { url: 'https://scholarshipamerica.org/students/browse-scholarships/?_paged=4' },
    { url: 'https://scholarshipamerica.org/students/browse-scholarships/?_paged=5' },
  ];

  const wf = await fox
    .init('https://scholarshipamerica.org/students/browse-scholarships/')
    .fetch({ maxPages: 5 })
    .plan();

  return itRunMatrix(
    it,
    'paginate scholarshipamerica.org',
    wf.dump(),
    matrix,
    [
      (items) => checkItemsAI(items, expected, ['url']),
    ],
    { shouldSave: true });
});
