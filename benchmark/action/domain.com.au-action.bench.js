import { fox, DiskCache, DiskKV } from '../../src/index.js';
import { srid } from '../../src/util.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('extract domain.com.au', async function() {
  const matrix = standardMatrix();

  const cases = [
    {
      name: 'sydneycoveproperty-6877',
      url: 'https://www.domain.com.au/real-estate-agencies/sydneycoveproperty-6877/',
      expected: [
        {
          name: 'Bryn Fowler',
          phone: '02 8259 3333',
        },
        {
          name: 'Monique Lavers',
          phone: '08 2593 333',
        },
        {
          name: 'Brenden Taliana',
          phone: '02 9241 1288',
        },
        {
          name: 'Grant Ashby',
          phone: '02 9241 1288',
        },
        {
          name: 'Cherie Xue',
          phone: '02 9241 1288',
        },
        {
          name: 'Kayla Caldwell',
          phone: '02 9241 1288',
        },
        {
          name: 'Robert McFadden',
          phone: '0418 108 478',
        }
      ],
    },

    {
      name: 'mortoncircularquay-4650',
      url: 'https://www.domain.com.au/real-estate-agencies/mortoncircularquay-4650/',
      expected: [
        {
          name: 'Ettiene West',
          phone: '0410 593 749',
        },
        {
          name: 'Arman Zounuzy',
          phone: '0410 539 793',
        },
        {
          name: 'Arta Kains',
          phone: '0438 418 229',
        },
        {
          name: 'Christina Tsousta',
          phone: '0408 577 427',
        },
        {
          name: 'Cesar Rojas Soto',
          phone: '0407 547 996',
        },
        {
          name: 'Reza Nabavi',
          phone: '0419 283 588',
        },
        {
          name: 'Emma Ryan',
          phone: '0409 325 440',
        },
        {
          name: 'Amit Bansode',
          phone: '0448 051 225',
        },
        {
          name: 'Alexander Karabanov',
          phone: '0409 896 152',
        },
      ],
    },
    {
      name: 'ayrerealestate-32220',
      url: 'https://www.domain.com.au/real-estate-agencies/ayrerealestate-32220/',
      expected: [
        {
          name: 'Adrian Wilson',
          phone: '02 8319 4488',
        },
        {
          name: "Brody O'Brien",
          phone: '02 8319 4488',
        },
        {
          name: 'Craig Donohue',
          phone: '02 8319 4488',
        },
        {
          name: 'Emma Vadas',
          phone: '02 8319 4411',
        },
        {
          name: 'Ashlee Hickey',
          phone: '02 8319 4488',
        },
        {
          name: 'Chervonne Papworth',
          phone: '02 8319 4488',
        },
        {
          name: 'Erinna McGhee',
          phone: '02 9037 2221',
        },
        {
          name: 'Noemi Guttmann',
          phone: '02 8319 4488',
        },
        {
          name: 'Rylee Ritchie',
          phone: '02 8319 4488',
        },
        {
          name: 'Kate-Louise McFarlin',
          phone: '02 9037 2221',
        },
        {
          name: 'Yianni Pikos',
          phone: '02 9037 2221',
        },
        {
          name: 'Michael Hendricks',
          phone: '02 9037 2221',
        }
      ],
    },
  ];

  for (const { name, url, expected } of cases) {
    const wf = await fox
      .init(url)
      .action({
        commands: [
          'Click the button that says "View more agents", if it exists. Then, click on each phone number for the agents in the "Our Team" section exactly once, and then send the HTML for the entire page'
        ]
      })
      .extract({
        questions: {
          name: 'Name of the agent',
          phone: 'Phone number of the agent',
        },
        mode: 'multiple',
      })
      .plan();

    await itRunMatrix(
      it,
      `extract domain.com.au (${name})`,
      wf.dump(),
      matrix,
      [
        (items) => {
          console.log('items', items);
          return checkItemsAI(items, expected, ['name', 'phone']);
        }
      ],
      {
        shouldSave: true,
        kv: new DiskKV('/tmp/ffbenchkv-2'),
      });
  }
});
