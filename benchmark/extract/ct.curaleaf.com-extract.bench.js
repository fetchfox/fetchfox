import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('extract ct.curaleaf.com', async function() {
  const matrix = standardMatrix();

  const cases = [
    {
      url: 'https://ct.curaleaf.com/shop/connecticut/curaleaf-ct-stamford/products/6707112fe6c31500014349ef',
      expected: {
        name: 'Curaleaf Whole Flower Raspberry P (S) 00169',
        price: '$34',
        weight_oz: '1/8oz',
        weight_grams: '3.5g',
        strength: '15.27% Total THC',
      },
    },

    {
      url: 'https://ct.curaleaf.com/shop/connecticut/curaleaf-ct-stamford/products/67cb3831ca2e3669ed31421e',
      expected: {
        name: 'Curaleaf Whole Flower Ivory (H) 00533',
        price: '$34',
        weight_oz: '1/8oz',
        weight_grams: '3.5g',
        strength: '26.04% Total THC',
      },
    },

    {
      url: 'https://ct.curaleaf.com/shop/connecticut/curaleaf-ct-stamford/products/674f41cb1f816bc40fa34eed',
      expected: {
        name: 'Curaleaf Whole Flower Indica Princess (I) 00246',
        price: '$32',
        weight_oz: '1/8oz',
        weight_grams: '3.5g',
        strength: '18.98% Total THC',
      },
    },
  ];

  for (const { url, expected } of cases) {
    const wf = await fox
      .init(url)
      .extract({
        questions: {
          name: 'Name of the product',
          price: 'Price of the product. Format: $XX',
          weight_oz: 'Weight in oz',
          weight_grams: 'Weight in g. Format: XX.Xg',
          strength: 'Strength % THC',
        },
        mode: 'single',
      })
      .plan();

    await itRunMatrix(
      it,
      'extract ct.curaleaf.com',
      wf.dump(),
      matrix,
      [
        (items) => checkItemsAI(items, [expected], Object.keys(expected))
      ],
      { shouldSave: true });
  }
});
