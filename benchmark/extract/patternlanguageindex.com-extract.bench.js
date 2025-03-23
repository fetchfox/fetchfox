import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsExact } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('extract patternlanguageindex.com', async function() {
  const matrix = standardMatrix();

  const expected = [];

  const wf = await fox
    .init('https://www.patternlanguageindex.com/')
    .extract({
      text:	'What is the text of the link?',
      url: 'What is the url of the link?',
    })
    .limit(5)
    .plan();

  return itRunMatrix(
    it,
    'extract patternlanguageindex.com',
    wf.dump(),
    matrix,
    [
      // (items) => checkItemsExact(items, expected),
      // TODO: check for 200+ items
    ],
    { shouldSave: true });
});
