import fetch from 'node-fetch';
import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsExact } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';


describe('network bench', async () => {
  const matrix = standardMatrix();
  const expected = [];

  return itRunMatrix(
    it,
    `network bench`,
    'ukchh85q9c',
    matrix,
    [
      (items) => {
        console.log('items');
      },
    ],
    { shouldSave: true });
});
