import { fox, DiskCache, DiskKV, S3KV } from '../../src/index.js';
import { srid } from '../../src/util.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('action businessregistration.moc.gov.kh', async function() {
  const matrix = standardMatrix();

  const cases = [];

  const wf = await fox
    .init('https://www.businessregistration.moc.gov.kh/')
    .action({
      commands: [
        'Click "Online Services" and then click "Search Entity"',
        'Type in "a" for "Entity Name or Identifier" and press Enter to submit',
        'Click on each business name, send HTML, and then click back. After doing this for all businesses, repeat click next page up to 5 times and repeat for the new set of businesses.',
      ]
    })
    .limit(20)
    .plan();

  await itRunMatrix(
    it,
    `action businessregistration.moc.gov.kh`,
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
