import { fox, DiskCache, DiskKV, S3KV } from '../../src/index.js';
import { srid } from '../../src/util.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('action domain.com.au', async function() {
  const matrix = standardMatrix();

  const cases = [
    {
      name: 'townsville-city-qld-4810',
      url: 'https://www.domain.com.au/real-estate-agents/townsville-city-qld-4810/',
      expected: [
        {
          name: 'Giovanni Spinella',
          phone: '0406 664 191',
        },
        {
          name: 'Marion Grice',
          phone: '0412 960 744',
        },
        {
          name: 'Damien Keyes',
          phone: '07 4447 9010',
        },
        {
          name: 'Karyn Voevodin',
          phone: '0417 616 004',
        },
        {
          name: 'Taylor Pearce',
          phone: '0403 093 225',
        },
        {
          name: 'Jabyn Manning',
          phone: '07 4750 4000',
        },
        {
          name: 'Dean Dank',
          phone: '0444 847 00',
        },
        {
          name: 'Tammy Tyrrell',
          phone: '07 4772 2022',
        },
        {
          name: 'Leanne Harris',
          phone: '07 4727 2450',
        },
        {
          name: 'Janelle Bourne',
          phone: '0405 158 070',
        },
        {
          name: 'Shane Lindo',
          phone: '0438 418 474',
        },
        {
          name: 'Jodi Westcott',
          phone: '07 4727 2450',
        },
        {
          name: 'Dan Ryder',
          phone: '0408 887 021',
        },
        {
          name: 'Jaimee Rankin',
          phone: '0498 656 483',
        },
        {
          name: 'Phill Charlwood',
          phone: '0404 144 607',
        },
      ],
    },

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
        },
        {
          name: 'Kate Sommervelle',
          phone: '02 9037 2221',
        },
        {
          name: 'Chyeann Shannon',
          phone: '02 9037 2221',
        },
        {
          name: "Amy O'Donnell",
          phone: '02 9037 2221',
        },
        {
          name: 'Ying Ying Xu',
          phone: '02 8319 4488',
        },
      ],
    },
  ];

  const prefixes = [
    // 'benchkv/fixed/',
    `benchkv/random-${srid()}/`,
  ];

  for (const prefix of prefixes) {
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
        `action domain.com.au (name=${name}, prefix=${prefix})`,
        wf.dump(),
        matrix,
        [
          (items) => {
            console.log(items);
            return checkItemsAI(items, expected, ['name', 'phone']);
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
