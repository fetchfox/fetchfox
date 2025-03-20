import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI } from '../lib/checks.js';

describe('scotchwhiskyauctions.com', async function() {
  const matrix = standardMatrix();

  const expected = {
    item_name: `'Sideburn' 31 Year Old Blended Malt Whisky Sponge Edition No.95`,
    bottle_size: '70cl',
    current_bid: '£210',
  };

  const cases = [
    {
      name: 'live',
      url: 'https://www.scotchwhiskyauctions.com/auctions/213-the-164th-auction/790441-sideburn-31-year-old-blended-malt-whisky-sponge-edition-no95/',
      expected,
    },
    {
      name: 'saved',
      url: 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/bw4guc2zyo/https-www-scotchwhiskyauctions-com-auctions-213-the-164th-auction-790441-sideburn-31-year-old-blended-malt-whisky-sponge-edition-no95-.html',
      expected,
    },
  ];

  const questions = {
    item_name: 'What is the name of the auction item?',
    bottle_size: 'What is the size of the bottle?',
    current_bid: 'What is the current bid for the item?'
  }

  for (const { name, url, expected } of cases) {
    const wf = await fox
      .init(url)
      .extract({
        questions,
        hint: 'Agree to age verification',
        maxPages: 1,
        mode: 'single',
      })
      .plan();

    await itRunMatrix(
      it,
      `extract from scotchwhiskyauctions.com (${name})`,
      wf.dump(),
      matrix,
      [
        (items) => checkItemsAI(items, [expected], questions, ['item_name', 'bottle_size', 'current_bid'])
      ],
      { shouldSave: true });
  }
});
