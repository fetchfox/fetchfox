import * as cheerio from 'cheerio';
import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkIncreasingSize } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('wholefoodsmarket.com', async function() {
  const matrix = standardMatrix();

  const limit = 80;

  const wf = await fox
    .init('https://www.wholefoodsmarket.com/search?text=wine&category=white-wine')
    .extract({
      questions: {
        name: 'Product name',
        url: 'Product url',
      },
      maxPages: 5,
    })
    .limit(limit)
    .plan();

  return itRunMatrix(
    it,
    'should paginate wholefoodsmarket.com',
    wf.dump(),
    matrix,
    [
      (items) => {
        return [Math.min(items.length, limit), limit];
      }
    ],
    { shouldSave: true });
});
