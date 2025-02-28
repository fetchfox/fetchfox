import * as cheerio from 'cheerio';
import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkAtLeast } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('scotchwhiskyauctions.com', async function() {
  const matrix = standardMatrix({
    fetcher: [
      [
        'playwright',
        {
          headless: false,
        }
      ]
    ]
  });

  const wf = await fox
    .init('https://www.scotchwhiskyauctions.com/auctions/213-the-164th-auction/')
    .extract({
      questions: {
        url: 'URL of the auction page',
      },
      mode: 'auto',
      maxPages: 5,
    })
    .limit(80)
    .plan();

  return itRunMatrix(
    it,
    'should paginate scotchwhiskyauctions.com',
    wf.dump(),
    matrix,
    [
      (items) => checkAtLeast(items, 80)
    ],
    { shouldSave: true });
});
