// TODO:
import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsExact } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('paginate gurkhaskitchensunnyvale.com', async function () {
  const matrix = standardMatrix({
    fetcher: ['playwright'],
  });

  const expected = [
    {
      _sourceUrl: 'https://gurkhaskitchensunnyvale.com/product-category/non-catering/?filters=product_tag[145]',
    },
    {
      _sourceUrl: 'https://gurkhaskitchensunnyvale.com/product-category/non-catering/page/2/?filters=product_tag[145]',
    },
    {
      _sourceUrl: 'https://gurkhaskitchensunnyvale.com/product-category/non-catering/page/3/?filters=product_tag[145]',
    },
    {
      _sourceUrl: 'https://gurkhaskitchensunnyvale.com/product-category/non-catering/page/4/?filters=product_tag[145]',
    },
    {
      _sourceUrl: 'https://gurkhaskitchensunnyvale.com/product-category/non-catering/page/5/?filters=product_tag[145]',
    },
  ];

  const wf = await fox
    .init('https://gurkhaskitchensunnyvale.com/product-category/non-catering/?filters=product_tag[145]')
    .fetch({ pages: 5 })
    .plan();

  return itRunMatrix(
    it,
    'paginate gurkhaskitchensunnyvale.com',
    wf.dump(),
    matrix,
    [(items) => checkItemsExact(items, expected, ['_sourceUrl'])],
    { shouldSave: true },
  );
});
