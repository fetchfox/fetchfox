import { fox } from '../../src/index.js';
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
          return checkItemsAI(items, expected, ['comment_text', 'comment_author']);
        }
      ],
      { shouldSave: true });
  }
});
