import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsExact } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('extract https://www.patternlanguageindex.com/', async function() {
  const matrix = standardMatrix();

  const expected = [
  ];

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
    'extract pokemon from pokemondb.net/pokedex/national',
    wf.dump(),
    matrix,
    [
      (items) => checkItemsExact(items, expected),
    ],
    { shouldSave: true });
});
