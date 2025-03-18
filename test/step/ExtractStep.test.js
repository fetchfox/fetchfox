import assert from 'assert';
import os from 'os';
import { fox } from '../../src/index.js';
import { testCache, setTestTimeout } from '../lib/util.js';

describe('ExtractStep', function() {

  setTestTimeout(this);

  it('should supplement items with subsequent extractions @fast', async () => {
    const f = await fox
      .config({
        ai: 'openai:gpt-4o',
        cache: testCache(),
      })
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        url: 'What is the URL of this pokemon',
        name: 'What is the name of the pokemon?',
        number: 'What is the pokedex number?',
        maxPages: 1,
      })
      .extract({
        height: 'What is the height of this pokemon?',
        maxPages: 1,
      })
      .limit(3);

    const out = await f.run();

    const expectedKeys = [
      'url',
      'name',
      'number',
      'height',
    ];

    assert.equal(out.items.length, 3);

    for (const item of out.items) {
      assert.ok(Object.keys(item).includes(...expectedKeys));
    }

    f.abort();
  });


  it('should not overwrite with (not found) @fast', async () => {
    const f = await fox
      .config({
        ai: 'openai:gpt-4o',
        cache: testCache(),
      })
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        name: 'What is the name of the pokemon? Starting with the first numbered pokemon',
        url: 'What is the URL of this pokemon',
        number: 'What is the pokedex number? Format: #0001',
        height: 'What is the height of this pokemon?',
        maxPages: 1,
      })
      .extract({
        number: 'What is the number of times this pokemon has eaten at McDonalds?',
        height: 'What is the height of this pokemon?',
        maxPages: 1,
      })
      .limit(3);

    const out = await f.run();

    const expectedKeys = [
      'url',
      'name',
      'number',
      'height',
    ];

    const expected = [
      {
        name: 'Bulbasaur',
        url: 'https://pokemondb.net/pokedex/bulbasaur',
        number: '#0001',
        height: '0.7 m (2′04″)',
      },
      {
        name: 'Ivysaur',
        url: 'https://pokemondb.net/pokedex/ivysaur',
        number: '#0002',
        height: '1.0 m (3′03″)',
      },
      {
        name: 'Venusaur',
        url: 'https://pokemondb.net/pokedex/venusaur',
        number: '#0003',
        height: '2.0 m (6′07″)',
      },
    ];

    assert.equal(out.items.length, 3);

    out.items.sort((a, b) => a.number.localeCompare(b.number));
    for (let i = 0; i < expected.length; i++) {
      const item = out.items[i];
      const e = expected[i];

      const filtered = {};
      Object.keys(e).map(k => filtered[k] = item[k]);
      assert.equal(JSON.stringify(filtered), JSON.stringify(e));
    }

    f.abort();
  });
});
