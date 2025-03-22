import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI } from '../lib/checks.js';

describe('extract equipnet.com', async function() {
  const matrix = standardMatrix();

  const cases = [
    {
      name: 'live',
      url: 'https://www.equipnet.com/auctions/catalog/march-lab/1476/',
      expected: [],
    },
    // {
    //   name: 'saved',
    //   url: '',
    //   expected,
    // },
  ];

  const expected = [];

  const questions = {
    auctionName: 'What the name of the auction',
    location: 'What is the location',
    category: 'what is the category',
    url: 'what is the auction url',
  }

  for (const { name, url, expected } of cases) {
    const wf = await fox
      .init(url)
      .extract({
        questions,
        mode: 'multiple',
        view: 'html',
      })
      .limit(50)
      .plan();

    await itRunMatrix(
      it,
      `extract ct.curaleaf.com (${name})`,
      wf.dump(),
      matrix,
      [
        (items) => checkItemsAI(items, expected, questions),
      ],
      { shouldSave: true });
  }
});
