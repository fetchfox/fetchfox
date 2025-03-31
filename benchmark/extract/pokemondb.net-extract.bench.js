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
    },
    {
      name: 'Ivysaur',
      number: '#0002',
    },
    {
      name: 'Venusaur',
      number: '#0003',
    },
    {
      name: 'Charmander',
      number: '#0004',
    },
    {
      name: 'Charmeleon',
      number: '#0005',
    },
  ];

  const cases = [
    {
      name: 'live',
      url: 'https://pokemondb.net/pokedex/national',
      expected,
    },
    {
      name: 'saved',
      url: 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/djh6e69cux/https-pokemondb-net-pokedex-national.html',
      expected,
    },
  ];

  const questions = {
    name:	'What is the name of this pokemon?',
    number: 'What is the pokemon number',
    description: `Describe this pokemon in 50-100 words`,
  }

  for (const { name, url, expected } of cases) {
    const wf = await fox
      .init(url)
      .extract({ questions })
      .limit(5)
      .plan();

    itRunMatrix(
      it,
      `extract pokemondb.net (${name})`,
      wf.dump(),
      matrix,
      [
        (items) => checkItemsAI(items, expected, questions),
      ],
      { shouldSave: true });
  }
});
