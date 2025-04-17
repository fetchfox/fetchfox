import assert from 'assert';
import { getAI } from '../../src/ai/index.js';
import { getFetcher } from '../../src/fetch/index.js';
import { Mapper, comparePatterns, toExample } from '../../src/crawl/Mapper.js';
import { testCache } from '../lib/util.js';


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

  it('should convert to example @fast', async () => {
    const cases = [
      {
        pattern: 'https://www.example.com/path/*',
        expected: 'https://www.example.com/path/val1',
      },
      {
        pattern: 'https://www.example.com/path/:id/:sub-id',
        expected: 'https://www.example.com/path/val1/val2',
      },
    ];

    for (const { pattern, expected } of cases) {
      assert.equal(toExample(pattern), expected);
    }
  });

  it('should map multiple levels', async () => {
    // const mapper = new Mapper({ cache: testCache() });
    const cdp = process.env.CDP_URL;
    console.log('use cdp', cdp);

    const mapper = new Mapper({
      // cache: testCache(),
      ai: getAI('openai:gpt-4o', { cache: testCache() }),
      fetcher: getFetcher('playwright', { cdp, cache: testCache() })
    });
    console.log('mapper', mapper);

    const urls = ['https://www.coldwellbanker.com/sitemap/agents'];

    // await mapper.run(urls, { maxIterations: 1 });
    // console.log('OUT:', mapper.layoutString(urls));

    // await mapper.run(urls, { maxIterations: 2 });
    // console.log('OUT:', mapper.layoutString(urls));

    // await mapper.run(urls, { maxIterations: 3 });
    // console.log('OUT:', mapper.layoutString(urls));

    await mapper.run(urls, { maxIterations: 4 });
    console.log('OUT:', mapper.layoutString(urls));

    console.log('d1', mapper.distance(
      'https://www.coldwellbanker.com/city/nh/grantham/agents',
      'https://www.coldwellbanker.com/*/*/agents/*/aid-*'
    ));

    assert.equal(
      mapper.distance(
        'https://www.coldwellbanker.com/city/nh/grantham/agents',
        'https://www.coldwellbanker.com/*/*/agents/*/aid-*'
      ),
      1);
  });

});
