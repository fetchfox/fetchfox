import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsExact } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('extract scotchwhiskyauctions.com', async function() {
  const matrix = standardMatrix();

  const expected = {
    item_name: `'Sideburn' 31 Year Old Blended Malt Whisky Sponge Edition No.95`,
    bottle_size: '70cl',
    current_bid: '£210',
  };
  const wf = await fox
    .init(`https://www.scotchwhiskyauctions.com/auctions/213-the-164th-auction/790441-sideburn-31-year-old-blended-malt-whisky-sponge-edition-no95/`)
    .extract({
      questions: {
        item_name: 'What is the name of the auction item?',
        bottle_size: 'What is the size of the bottle?',
        current_bid: 'What is the current bid for the item?'
      },
      hint: 'Agree to age verification',
      maxPages: 1,
      mode: 'single',
    })
    .plan();

  await itRunMatrix(
    it,
    'extract scotchwhiskyauctions.com',
    wf.dump(),
    matrix,
    [
      (items) => checkItemsExact(items, [expected], ['item_name', 'bottle_size', 'current_bid'])
    ],
    { shouldSave: true });
});
