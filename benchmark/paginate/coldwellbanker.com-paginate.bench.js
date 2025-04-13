import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkAtLeast } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('paginate coldwellbanker.com', async function() {
  const matrix = standardMatrix();
  const limit = 100;
  const wf = await fox
    .init('https://www.coldwellbanker.com/*/*/agents/*/aid-*')
    .crawl({
      suggestions: ['https://www.coldwellbanker.com/city/az/lake-havasu-city/agents'],
      maxIterations: 1,
      maxPageas: 10,
    })
    .limit(limit)
    .plan();

  itRunMatrix(
    it,
    'paginate coldwellbanker.com',
    wf.dump(),
    matrix,
    [
      (items) => checkAtLeast(items, limit),
    ],
    { shouldSave: true });
});
