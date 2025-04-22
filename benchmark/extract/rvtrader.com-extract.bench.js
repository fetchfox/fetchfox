import { fox, S3KV } from '../../src/index.js';
import { Item } from '../../src/item/index.js';
import { srid } from '../../src/util.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI } from '../lib/checks.js';

describe('extract rvtrader.com', async function() {
  const matrix = standardMatrix();

  const prefixes = [
    // 'benchkv/fixed-2/',
    `benchkv/random-${srid()}/`,
  ];

  const cases = [
    {
      name: 'live 1',
      // url: 'https://www.rvtrader.com/listing/2023-Escape+Trailer+Industries-21C-5035697661',
      url: 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/4q15zt0nbl/https-www-rvtrader-com-listing-2023-Escape-Trailer-Industries-21C-5035697661',
      expected: [{
        model_name: '21C',
        price: '$52,000',
        year: '2023',
        condition: 'Used',
        location: 'Pacifica, CA',
        contact: 'Pop RV',
        class: 'Travel Trailer',
        make: 'Escape Trailer Industries',
        model: '21C',
        mileage: '',
      }],
    },

    {
      name: 'live 2',
      // url: 'https://www.rvtrader.com/listing/2023-Escape+Trailer+Industries-ESCAPE+5.0-5035899563',
      url: 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/epz4keju9r/https-www-rvtrader-com-listing-2023-Escape-Trailer-Industries-ESCAPE-5-0-5035899563',
      expected: [{
        model_name: '2023 Escape Trailer Industries ESCAPE 5.0',
        price: '$55,950',
        year: '2023',
        condition: 'Used',
        location: 'Arlington, WA',
        contact: 'Private Seller',
        class: 'Fifth Wheel',
        make: 'Escape Trailer Industries',
        model: 'ESCAPE 5.0',
        mileage: '4,000',
      }],
    },
  ];

  const questions = {
    "model_name": "What is the subtitle model name of the used RV model?",
    "price": "What is the price of this used RV?",
    "year": "What is the manufacturing year of this RV?",
    "condition": "What is the condition of this RV?",
    "location": "Where is this RV located?",
    "contact": "Who is the Contact of the RV? 'Private Party' or 'Dealer'?",
    "class": "What is the Class of the RV?",
    "make": "What is the Make of the RV?",
    "model": "What is the Model of the RV?",
    "mileage": "How many Miles are on the RV?",
  };

  for (const prefix of prefixes) {
    for (const { name, url, expected } of cases) {
      const wf = await fox
        .init(url)
        .extract({
          questions,
          mode: 'single',
          view: 'html',
          maxPages: 1,
        })
        .plan();

      itRunMatrix(
        it,
        `extract rvtrader.com (name=${name}, prefix=${prefix})`,
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
        {
          shouldSave: true,
          kv: new S3KV({
            bucket: 'ffcloud',
            prefix,
            acl: 'public-read',
          }),
        });
    }
  }
});
