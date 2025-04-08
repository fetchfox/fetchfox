import { fox, DiskCache, DiskKV, S3KV } from '../../src/index.js';
import { srid } from '../../src/util.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkAtLeast } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('action members.theaapc.org', async function() {
  const matrix = standardMatrix();

  const cases = [];

  const limit = 100;

  const wf = await fox
    .init('https://members.theaapc.org/search/custom.asp?id=7304')
    .action({
      commands: [
        'click continue, and then wait 10 seconds, and then go through all pages, sending HTML for each page',
      ]
    })
    .extract({
      name: 'Company name',
      url: 'Profile Full Absolute URL',
    })
    .limit(limit)
    .plan();

  itRunMatrix(
    it,
    `action members.theaapc.org`,
    wf.dump(),
    matrix,
    [
      (items) => checkAtLeast(items, 100),
    ],
    { shouldSave: true, });

});
