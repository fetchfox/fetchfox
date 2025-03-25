import { fox } from '../../src/index.js';
import { Item } from '../../src/item/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI } from '../lib/checks.js';

describe('extract ct.curaleaf.com', async function() {
  const matrix = standardMatrix();

  const expected = [
    {
      product_name: 'Curaleaf Whole Flower A Tartz (H) 00522',
      product_weight: '1/8oz',
      product_strength: '31.02% THCA â€¢ 27.83% Total THC',
      product_description: 'Curaleaf Whole Flower A Tartz',
      product_strain: 'Hybrid',
      product_price: '$34'
    },
    {
      product_name: 'Curaleaf Whole Flower Ivory (H) 00533',
      product_weight: '1/8oz',
      product_strength: '28.7% THCA â€¢ 26.04% Total THC',
      product_description: 'Curaleaf Whole Flower Ivory',
      product_strain: 'Hybrid',
      product_price: '$34'
    },
    {
      product_name: 'Curaleaf Whole Flower Banana Papaya (S) 00441',
      product_weight: '1/8oz',
      product_strength: '25.24% THCA â€¢ 22.46% Total THC',
      product_description: 'Curaleaf Whole Flower Banana Papaya',
      product_strain: 'Sativa',
      product_price: '$34'
    },
    {
      product_name: 'Curaleaf Whole Flower Slip (I) 00354',
      product_weight: '1/8oz',
      product_strength: '21.86% THCA â€¢ 19.54% Total THC',
      product_description: 'Curaleaf Whole Flower Slip',
      product_strain: 'Indica',
      product_price: '$34'
    },
    {
      product_name: 'Curaleaf Whole Flower Indica Princess (I) 00246',
      product_weight: '1/8oz',
      product_strength: '21.35% THCA â€¢ 18.98% Total THC',
      product_description: 'Curaleaf Whole Flower Indica Princess',
      product_strain: 'Indica',
      product_price: '$32'
    },
    {
      product_name: 'Curaleaf Whole Flower GSC (H) 00399',
      product_weight: '1/8oz',
      product_strength: '19.09% THCA â€¢ 17.09% Total THC',
      product_description: 'Curaleaf Whole Flower GSC',
      product_strain: 'Hybrid',
      product_price: '$34'
    },
    {
      product_name: 'Curaleaf Whole Flower Montana Silvertip (H) 00391',
      product_weight: '1/8oz',
      product_strength: '22.67% THCA â€¢ 20.17% Total THC',
      product_description: 'Curaleaf Whole Flower Montana Silvertip',
      product_strain: 'Hybrid',
      product_price: '$34'
    },
    {
      product_name: 'Curaleaf Ground Flower BCG (S) 00524',
      product_weight: '1/8oz',
      product_strength: '17.54% THCA â€¢ 15.51% Total THC',
      product_description: 'Curaleaf Ground Flower BCG',
      product_strain: 'Sativa',
      product_price: '$26'
    },
    {
      product_name: 'Curaleaf Ground Flower Teal (H) 00001',
      product_weight: '1/8oz',
      product_strength: '17.62% THCA â€¢ 15.72% Total THC',
      product_description: 'Curaleaf Ground Flower Teal',
      product_strain: 'Hybrid',
      product_price: '$32'
    },
    {
      product_name: 'Curaleaf Whole Flower Orange Z (S) 00294',
      product_weight: '1/8oz',
      product_strength: '21.07% Total THC â€¢ 20.43% THCA',
      product_description: 'Curaleaf Whole Flower Orange Z',
      product_strain: 'Sativa',
      product_price: '$34'
    },
    {
      product_name: 'Curaleaf Whole Flower Carmelita (I) 00581',
      product_weight: '1/8oz',
      product_strength: '25.91% THCA â€¢ 23.14% Total THC',
      product_description: 'Curaleaf Whole Flower Carmelita',
      product_strain: 'Indica',
      product_price: '$34'
    },
    {
      product_name: 'Curaleaf Whole Flower Mr E Pupil (S) 00289',
      product_weight: '1/8oz',
      product_strength: '23.46% THCA â€¢ 20.58% Total THC',
      product_description: 'Curaleaf Whole Flower Mr E Pupil',
      product_strain: '',
      product_price: '$34'
    },
    {
      product_name: 'Curaleaf Ground Flower Indica Princess (I) 00417',
      product_weight: '1/8oz',
      product_strength: '17.29% THCA â€¢ 15.2% Total THC',
      product_description: 'Curaleaf Ground Flower Indica Princess',
      product_strain: 'Indica',
      product_price: '$24'
    },
    {
      product_name: 'Curaleaf Whole Flower Raspberry P (S) 00169',
      product_weight: '1/8oz',
      product_strength: '18.48% THCA â€¢ 15.27% Total THC',
      product_description: 'Curaleaf Whole Flower Raspberry P',
      product_strain: 'Hybrid',
      product_price: '$34'
    },
    {
      product_name: 'Curaleaf Whole Flower Apes In Space (I) 00348',
      product_weight: '1/8oz',
      product_strength: '19.62% THCA â€¢ 17.57% Total THC',
      product_description: 'Curaleaf Whole Flower Apes In Space',
      product_strain: 'Indica',
      product_price: '$34'
    },
    {
      product_name: 'Whole Flower - Novarine (S) 23983',
      product_weight: '1/8oz',
      product_strength: '23.13% THCA â€¢ 20.61% Total THC',
      product_description: 'Whole Flower - Novarine',
      product_strain: 'Sativa',
      product_price: '$34'
    },
    {
      product_name: 'Curaleaf Whole Flower PBB (H) 00398',
      product_weight: '1/8oz',
      product_strength: '20.92% THCA â€¢ 19.04% Total THC',
      product_description: 'Curaleaf Whole Flower PBB',
      product_strain: 'Hybrid',
      product_price: '$34'
    },
    {
      product_name: 'Curaleaf Whole Flower Minium (I) 00577',
      product_weight: '1/8oz',
      product_strength: '30.78% THCA â€¢ 27.31% Total THC',
      product_description: 'Curaleaf Whole Flower Minium',
      product_strain: 'Indica',
      product_price: '$34'
    },
    {
      product_name: 'Curaleaf Whole Flower Auburn (H) 00580',
      product_weight: '1/8oz',
      product_strength: '31.05% THCA â€¢ 27.77% Total THC',
      product_description: 'Curaleaf Whole Flower Auburn',
      product_strain: 'Hybrid',
      product_price: '$34'
    },
    {
      product_name: 'Curaleaf Ground Flower BC (I) 00575',
      product_weight: '1/8oz',
      product_strength: '20.17% THCA â€¢ 18.04% Total THC',
      product_description: 'Curaleaf Ground Flower BC',
      product_strain: 'Indica',
      product_price: '$26'
    },
  ];

  const cases = [
    // {
    //   name: 'live',
    //   url: 'https://ct.curaleaf.com/shop/connecticut/curaleaf-ct-stamford/categories/flower',
    //   expected,
    // },
    {
      name: 'saved',
      url: 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/93ue3wfv78/https-ct-curaleaf-com-shop-connecticut-curaleaf-ct-stamford-categories-flower.html',
      expected,
    },
  ];

  const questions = {
    product_name: 'name of the product being sold',
    product_weight: 'weight of the product usually in grams ',
    product_strength: 'percentages of THC / CBD',
    product_description: 'answers the question, what is being sold? for example sour diesel',
    product_strain: 'hybrid, indica, or sativa',
    product_price: 'the cost of the flower product in dollars'
  };

  for (const { name, url, expected } of cases) {
    const wf = await fox
      .init(url)
      .extract({
        questions,
        mode: 'multiple',
        view: 'html',
        maxPages: 1,
      })
      .plan();

    await itRunMatrix(
      it,
      `extract ct.curaleaf.com (${name})`,
      wf.dump(),
      matrix,
      [
        (items) => {
          // console.log('CT items:', items);

          for (const i of items) {
            console.log(new Item(i).publicOnly());
          }

          return checkItemsAI(items, expected, questions);
        }
      ],
      { shouldSave: true });
  }
});
