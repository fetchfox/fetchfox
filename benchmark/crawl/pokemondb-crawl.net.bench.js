import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkExcludeUrls } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('crawl pokemondb', async function() {
  const matrix = standardMatrix();

  const wf = await fox
    .init('https://pokemondb.net/pokedex/*')
    .crawl()
    .limit(20)
    .plan();

  itRunMatrix(
    it,
    'crawl pokemon',
    wf.dump(),
    matrix,
    [
      (items) => {
        console.log('items', items);
      },
    ],
    { shouldSave: true });
});
