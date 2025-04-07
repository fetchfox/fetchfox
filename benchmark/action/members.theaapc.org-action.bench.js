import { fox, DiskCache, DiskKV, S3KV } from '../../src/index.js';
import { srid } from '../../src/util.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('action members.theaapc.org', async function() {
  const matrix = standardMatrix();

  const cases = [];

  const wf = await fox
    .init('https://members.theaapc.org/search/custom.asp?id=7304')
    .action({
      commands: [
        'click continue, and then wait 10 seconds, and then send html',
      ]
    })
    .extract({
      name: 'Company name',
      url: 'Profile Full Absolute URL',
    })
    .limit(10)
    .plan();

  itRunMatrix(
    it,
    `action members.theaapc.org`,
    wf.dump(),
    matrix,
    [
      (items) => {
        console.log(items);
        // return checkItemsAI(items, expected);
        return [0, 1];
      }
    ],
    { shouldSave: true, });

});
