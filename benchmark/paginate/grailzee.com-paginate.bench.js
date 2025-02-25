import * as cheerio from 'cheerio';
import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkIncreasingSize } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('grailzee.com', async function() {
  const matrix = standardMatrix();

  const wf = await fox
    .init('https://grailzee.com/pages/completed-auctions?sort=1&q=Starbucks&papers=1')
    .extract({
      questions: {
        title: 'Auction title',
        url: 'Auction url',
      },
      mode: 'auto',
      maxPages: 3,
      hint: 'paginate using infinite scroll',
    })
    .limit(50)
    .plan();

  return itRunMatrix(
    it,
    'should paginate using infinite scroll',
    wf.dump(),
    matrix,
    [
      (items) => {
        // There should be at least 50 results
        return [Math.min(items.length, 50), 50];
      }
    ],
    { shouldSave: true });
});
