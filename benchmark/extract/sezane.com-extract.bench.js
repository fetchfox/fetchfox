import { fox } from '../../src/index.js';
import { Item } from '../../src/item/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI } from '../lib/checks.js';

describe('extract sezane.com', async function() {
  const matrix = standardMatrix();

  const expected = [
  ];

  const cases = [
    {
      name: 'live',
      url: 'https://www.sezane.com/us/product/gaspard-cardigan/navy#size-XS',
      expected,
    },
    // {
    //   name: 'saved',
    //   url: 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/93ue3wfv78/https-ct-curaleaf-com-shop-connecticut-curaleaf-ct-stamford-categories-flower.html',
    //   expected,
    // },
  ];

  const questions = {
    "name": "What is the name/title of the product (excluding colour or size info)?",
    "sizingData": "What are all the sizes? Provide every size for that product.  All I need is a python list of sizes",
    "availabilityData": "What is the availability of the sizes? Provide availability for every size. All I need is a python list of true and false in the same order as sizingData"
  };

  for (const { name, url, expected } of cases) {
    const wf = await fox
      .init(url)
      .extract({
        questions,
        mode: 'single',
        view: 'html',
        maxPages: 1,
      })
      .limit(20)
      .plan();

    itRunMatrix(
      it,
      `extract sezane.com (${name})`,
      wf.dump(),
      matrix,
      [
        (items) => {
          for (const i of items) {
            console.log(new Item(i).publicOnly());
          }

          return checkItemsAI(items, expected, questions);
        }
      ],
      { shouldSave: true });
  }
});
