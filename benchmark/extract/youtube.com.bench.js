import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsExact } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('extract from youtube.com', async function() {
  const matrix = standardMatrix({
    view: [
      'html',
      'text',
    ]
  });

  const cases = [
    {
      id: '5K5YouLhQlg',
      expected: {
        title: 'How to Setup Revit - Beginner Revit Tutorial',
        creator: 'Balkan Architect',
      },
    },
    {
      id: 'ka_aQats4oI',
      expected: {
        title: 'Scrape GitHub repos from X.com tweets',
        creator: 'Fetchfox AI',
      },
    },
    {
      id: 'hUvcWXTIjcU',
      expected: {
        title: 'Bob Dylan - Desolation Row (Official Audio)',
        creator: 'Bob Dylan',
      },
    },
  ];

  for (const { id, expected } of cases) {
    const wf = await fox
      .init(`https://www.youtube.com/watch?v=${id}`)
      .extract({
        questions: {
          title: 'What is the title of this video?',
          creator: 'Who is the creator of this video?',
        },
        view: '{{view}}',
        single: true
      })
      .plan();
    await itRunMatrix(
      it,
      `extract title and creator from youtube.com video id=${id}`,
      wf.dump(),
      matrix,
      [
        (items) => checkItemsExact(items, [expected]),
      ],
      { shouldSave: true });
  }
});
