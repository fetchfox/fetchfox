import assert from 'assert';
import { comparePatterns } from '../../src/crawl/Mapper.js';

describe('Mapper', function() {

  it('should compare paths @fast', async () => {
    const cases = [
      {
        a: 'https://pokemondb.net/scarlet-violet',
        b: 'https://pokemondb.net/',
        expected: -1,
      },

      {
        a: 'https://pokemondb.net/:game-id',
        b: 'https://pokemondb.net/',
        expected: -1,
      },

      {
        a: 'https://pokemondb.net/:game/:id',
        b: 'https://pokemondb.net/:game',
        expected: -1,
      },

      {
        a: 'https://pokemondb.net/pokebase/chat',
        b: 'https://pokemondb.net/type',
        expected: -1,
      },

      {
        a: 'https://pokemondb.net/type/:type-id',
        b: 'https://pokemondb.net/pokebase/meta',
        expected: 1,
      },
    ]

    for (const { a, b, expected } of cases) {
      assert.equal(comparePatterns(a, b), expected);
    }
  });

  it('should sort paths @fast', () => {
    const l = [
      'https://pokemondb.net/:game',
      'https://pokemondb.net/ability',
      'https://pokemondb.net/ability/:ability-id',
      'https://pokemondb.net/move',
      'https://pokemondb.net/pokebase',
      'https://pokemondb.net/pokebase/chat',
      'https://pokemondb.net/pokebase/meta',
      'https://pokemondb.net/pokedex/:pokemon-id',
      'https://pokemondb.net/scarlet-violet',
      'https://pokemondb.net/type',
      'https://pokemondb.net/',
      'https://pokemondb.net/type/:type-id',
    ];
    l.sort(comparePatterns);

    const expected = [
      'https://pokemondb.net/pokebase/chat',
      'https://pokemondb.net/pokebase/meta',
      'https://pokemondb.net/ability/:ability-id',
      'https://pokemondb.net/pokedex/:pokemon-id',
      'https://pokemondb.net/type/:type-id',
      'https://pokemondb.net/ability',
      'https://pokemondb.net/move',
      'https://pokemondb.net/pokebase',
      'https://pokemondb.net/scarlet-violet',
      'https://pokemondb.net/type',
      'https://pokemondb.net/:game',
      'https://pokemondb.net/',
    ];

    assert.equal(
      JSON.stringify(l, null, 2),
      JSON.stringify(expected, null, 2),
    );
  });

});


