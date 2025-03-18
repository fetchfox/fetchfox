import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsExact } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('extract from https://silvercreekrealty.net/silvercreek-agent-directory', async function() {
  const matrix = standardMatrix({
  });

  const expected = [
    {
      name: 'Bulbasaur',
      number: '#0001',
      url: 'https://pokemondb.net/pokedex/bulbasaur',
    },
    {
      name: 'Ivysaur',
      number: '#0002',
      url: 'https://pokemondb.net/pokedex/ivysaur',
    },
    {
      name: 'Venusaur',
      number: '#0003',
      url: 'https://pokemondb.net/pokedex/venusaur',
    },
    {
      name: 'Charmander',
      number: '#0004',
      url: 'https://pokemondb.net/pokedex/charmander',
    },
    {
      name: 'Charmeleon',
      number: '#0005',
      url: 'https://pokemondb.net/pokedex/charmeleon',
    },
  ];

  const wf = await fox
    .init('https://pokemondb.net/pokedex/national')
    .extract({
      name:	'What is the name of this pokemon?',
      number: 'What is the pokemon number',
      url: `What is the URL of the pokemon`,
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
