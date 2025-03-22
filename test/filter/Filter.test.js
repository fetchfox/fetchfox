import assert from 'assert';
import process from 'node:process';
import { logger } from '../../src/log/logger.js';
import { Filter } from '../../src/filter/Filter.js';
import { getAI } from '../../src/index.js';
import { testCache, setTestTimeout } from '../lib/util.js';

describe('Filter', function() {

  setTestTimeout(this);

  it('should filter @fast', async () => {
    const cache = testCache();
    const ai = getAI('openai:gpt-4o-mini', { cache });
    const filter = new Filter({ ai });

    const items = [
      {
        "national_dex_number":"#0001",
        "pokemon_name": "Bulbasaur",
        "type_1":"Grass",
        "type_2":"Poison",
        "url":"https://pokemondb.net/pokedex/bulbasaur",
      },
      {
        "national_dex_number":"#0002",
        "pokemon_name":"Ivysaur",
        "type_1":"Grass",
        "type_2":"Poison",
        "url":"https://pokemondb.net/pokedex/ivysaur",
      },
      {
        "national_dex_number":"#0004",
        "pokemon_name":"Charmander",
        "type_1":"Fire",
        "url":"https://pokemondb.net/pokedex/venusaur",
      },
    ]
    const gen = filter.run(items, 'grass type');
    const matches = [];
    for await (const m of gen) {
      matches.push(m);
    }
    assert.equal(
      JSON.stringify(matches),
      JSON.stringify([items[0], items[1]]));
  });

  it('should filter one at a time @fast', async () => {
    const cache = testCache();
    const ai = getAI('openai:gpt-4o-mini', { cache });
    const filter = new Filter({ ai });

    const items = [
      {
        "national_dex_number":"#0001",
        "pokemon_name": "Bulbasaur",
        "type_1":"Grass",
        "type_2":"Poison",
        "url":"https://pokemondb.net/pokedex/bulbasaur",
      },
      {
        "national_dex_number":"#0002",
        "pokemon_name":"Ivysaur",
        "type_1":"Grass",
        "type_2":"Poison",
        "url":"https://pokemondb.net/pokedex/ivysaur",
      },
      {
        "national_dex_number":"#0004",
        "pokemon_name":"Charmander",
        "type_1":"Fire",
        "url":"https://pokemondb.net/pokedex/venusaur",
      },
    ]

    const matches = [];
    for (const item of items) {
      const gen = filter.run([item], 'grass type');
      for await (const m of gen) {
        matches.push(m);
      }
    }
    assert.equal(
      JSON.stringify(matches),
      JSON.stringify([items[0], items[1]]));
  });

});
