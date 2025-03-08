import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkAtLeast } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('listado.mercadolibre.com.co', async function() {
  const matrix = standardMatrix();

  const limit = 100;
  const wf = await fox
    .init('https://listado.mercadolibre.com.co/monitor-75-hz')
    .extract({
      questions: {
        name: 'Name of the product',
      },
      maxPages: 10,
    })
    .limit(limit)
    .plan();

  return itRunMatrix(
    it,
    'paginate listado.mercadolibre.com.co',
    wf.dump(),
    matrix,
    [
      (items) => checkAtLeast(items, limit),
    ],
    { shouldSave: true });
});

