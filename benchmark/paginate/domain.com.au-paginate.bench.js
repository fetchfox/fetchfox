import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsExact } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('paginate domain.com.au', async function() {
  const matrix = standardMatrix();

  const expected = [
    'https://www.domain.com.au/real-estate-agents/north-sydney-nsw-2060/',
    'https://www.domain.com.au/real-estate-agents/north-sydney-nsw-2060/?page=2',
    'https://www.domain.com.au/real-estate-agents/north-sydney-nsw-2060/?page=3',
    'https://www.domain.com.au/real-estate-agents/north-sydney-nsw-2060/?page=4',
    'https://www.domain.com.au/real-estate-agents/north-sydney-nsw-2060/?page=5',
  ];

  const wf = await fox
    .init('https://www.domain.com.au/real-estate-agents/north-sydney-nsw-2060/')
    .fetch({ maxPages: 5 })
    .plan();

  return itRunMatrix(
    it,
    'paginate www.domain.com.au',
    wf.dump(),
    matrix,
    [
      (items) => checkItemsExact(items, expected, ['url']),
    ],
    { shouldSave: true });
});
