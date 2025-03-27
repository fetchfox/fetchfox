import { fox } from '../../src/index.js';
import { Item } from '../../src/item/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI } from '../lib/checks.js';

describe('extract finefettle.com', async function() {
  const matrix = standardMatrix();

  const expected = [];

  const cases = [
    // {
    //   name: 'live',
    //   url: 'https://www.finefettle.com/connecticut/stamford-dispensary/recreational/menu/flower',
    //   expected,
    // },

    {
      name: 'saved',
      url: 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/lqynlvd6fm/https-www-finefettle-com-connecticut-stamford-dispensary-recreational-menu-flower.html',
      expected,
    },
  ];

  const questions = {
    // url: 'url of product being sold. full absolute url',

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
      `extract finefettle.com (${name})`,
      wf.dump(),
      matrix,
      [
        (items) => {
          console.log('items:-->', items);
          // return checkItemsAI(items, expected, questions);
          return [0,1]
        }
      ],
      { shouldSave: true });
  }
});
