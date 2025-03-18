import * as cheerio from 'cheerio';
import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkAtLeast } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('fogorvoskereso.hu', async function() {
  const matrix = standardMatrix();

  const wf = await fox
    .init('https://www.fogorvoskereso.hu/rendelok?filter_specialty%5B0%5D=4&filter_clear_all_location=1')
    .extract({
      questions: {
        url: 'URL of the dentist page',
      },
      mode: 'auto',
      maxPages: 5,
    })
    .limit(80)
    .plan();

  return itRunMatrix(
    it,
    'should paginate fogorvoskereso.hu',
    wf.dump(),
    matrix,
    [
      (items) => checkAtLeast(items, 80)
    ],
    { shouldSave: true });
});
