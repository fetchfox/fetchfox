import fetch from 'node-fetch';
import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsExact, checkItemsAI } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

const limit = 5;

describe('network bench (prodrecent)', function () {
  const matrix = standardMatrix();
  const jobId = 'xxf4lzsicu';

  itRunMatrix(
    it,
    `network bench (prodrecent)`,
    jobId,
    matrix,
    [
      async (items) => {
        console.log('items -->', items);
        const resp = await fetch(`https://fetchfox.ai/api/v2/jobs/${jobId}`);
        const data = await resp.json();
        const expected = (data.results.items || []).slice(0, limit);
        return checkItemsAI(items, expected);
      },
    ],
    { shouldSave: true, limit }
  );
});
