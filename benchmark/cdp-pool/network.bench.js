import fetch from 'node-fetch';
import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsExact, checkItemsAI } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';


describe('network bench', async () => {
  const matrix = standardMatrix();
  const expected = [];

  const jobId = 'ukchh85q9c';
  const limit = 5;

  return itRunMatrix(
    it,
    `network bench`,
    jobId,
    matrix,
    [
      async (items) => {
        const resp = await fetch('https://fetchfox.ai/api/v2/jobs/' + jobId);
        const data = await resp.json();
        const expected = (data.results.items || []).slice(0, limit);
        return checkItemsAI(items, expected);
      },
    ],
    { shouldSave: true, limit });

});
