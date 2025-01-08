import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsExact } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('paginate https://action.myrealtyonegroup.com/real-estate-agents', async function() {
  const matrix = standardMatrix({
    fetcher: ['playwright'],
  });

  const expected = [
    { _sourceUrl: 'https://action.myrealtyonegroup.com/real-estate-agents' },
    { _sourceUrl: 'https://action.myrealtyonegroup.com/real-estate-agents/dsort-fa/2' },
    { _sourceUrl: 'https://action.myrealtyonegroup.com/real-estate-agents/dsort-fa/3' },
    { _sourceUrl: 'https://action.myrealtyonegroup.com/real-estate-agents/dsort-fa/4' },
    { _sourceUrl: 'https://action.myrealtyonegroup.com/real-estate-agents/dsort-fa/5' },
  ];

  const wf = await fox
    .init('https://action.myrealtyonegroup.com/real-estate-agents')
    .fetch({ maxPages: 5 })
    .plan();

  return itRunMatrix(
    it,
    'paginate https://action.myrealtyonegroup.com/real-estate-agents', 
    wf.dump(),
    matrix,
    [
      (items) => checkItemsExact(items, expected, ['_sourceUrl']),
    ],
    { shouldSave: true });
});
