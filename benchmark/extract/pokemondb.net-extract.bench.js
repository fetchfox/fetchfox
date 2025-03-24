import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI } from '../lib/checks.js';

describe('extract pokemondb.net', async function() {
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

  const cases = [
    // {
    //   name: 'live',
    //   url: 'https://pokemondb.net/pokedex/national',
    //   expected,
    // },
    {
      name: 'saved',
      url: 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/djh6e69cux/https-pokemondb-net-pokedex-national.html',
      expected,
    },
  ];

  const questions = {
    name:	'What is the name of this pokemon?',
    number: 'What is the pokemon number',
    url: `What is the URL of the pokemon`,
    description: `Describe this pokemon in 50-100 words`,
  }

  for (const { name, url, expected } of cases) {
    const wf = await fox
      .init(url)
      .extract({ questions })
      .limit(5)
      .plan();

    return itRunMatrix(
      it,
      `extract pokemondb.net (${name})`,
      wf.dump(),
      matrix,
      [
        (items) => {
          console.log('ITEMS', items);
          return checkItemsAI(items, expected, questions);
        }
      ],
      { shouldSave: true });
  }
});
