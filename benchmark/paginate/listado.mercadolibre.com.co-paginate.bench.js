import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsExact } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('paginate listado.mercadolibre.com.co', async function () {
  const matrix = standardMatrix({
    fetcher: ['playwright'],
    // fetcher: [['playwright', { headless: false }]],
  });

  const expected = [
    { _sourceUrl: 'https://listado.mercadolibre.com.co/pantalla-vertical-pc' },
    {
      _sourceUrl:
        'https://listado.mercadolibre.com.co/computacion/monitores-accesorios/pantalla-vertical-pc_Desde_51_NoIndex_True',
    },
    {
      _sourceUrl:
        'https://listado.mercadolibre.com.co/computacion/monitores-accesorios/pantalla-vertical-pc_Desde_101_NoIndex_True',
    },
    {
      _sourceUrl:
        'https://listado.mercadolibre.com.co/computacion/monitores-accesorios/pantalla-vertical-pc_Desde_151_NoIndex_True',
    },
  ];

  const wf = await fox.init('https://listado.mercadolibre.com.co/pantalla-vertical-pc').fetch({ pages: 4 }).plan();

  return itRunMatrix(
    it,
    'paginate listado.mercadolibre.com.co',
    wf.dump(),
    matrix,
    [(items) => checkItemsExact(items, expected, ['_sourceUrl'])],
    { shouldSave: true },
  );
});
