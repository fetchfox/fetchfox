import os from 'os';
import fs from 'fs';
import assert from 'assert';
import process from 'node:process';
import { Logger } from '../../src/log/logger.js';
import { fox } from '../../src/index.js';
import { testCache, setTestTimeout } from '../lib/util.js';

// Test the examples from README.md
describe('examples', function() {

  setTestTimeout(this);

  it('should do basic example @fast', async () => {
    const cases = [
      { ai: 'openai:gpt-4o' },
      // { ai: 'openai:gpt-4o-mini' },
      // { ai: 'openrouter:openai/gpt-4o' },
    ];

    const logger = new Logger({ prefix: 'abc123xyz' });
    // const cache = testCache();
    const cache = null;//testCache();

    for (const { ai } of cases) {
      const wf = await fox
        .config({
          ai,
          cache,
          logger,
        })
        .init(
          'https://pokemondb.net/pokedex/national',
        )
        .extract({
          questions: {
            name: 'Pokemon name, starting with the first pokemon',
            number: 'Pokemon number, format: #XXXX',
          },
          maxPages: 1,
        })
        .limit(3);

      const results = await wf.run(null, (delta) => {});

      assert.equal(results.items.length, 3);
      assert.equal(results.items[0].name, 'Bulbasaur');
      assert.equal(results.items[0].number, '#0001');
      assert.equal(results.items[1].name, 'Ivysaur');
      assert.equal(results.items[1].number, '#0002');
      assert.equal(results.items[2].name, 'Venusaur');
      assert.equal(results.items[2].number, '#0003');

      wf.abort();
    }
  });

  it('should do streaming example @fast', async () => {
    const stream = fox
      .config({ ai: 'openai:gpt-4o-mini', cache: testCache() })
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        questions:  {
          name: 'Pokemon name, starting with the first pokemon',
          number: 'Pokemon number, format: #XXXX',
        },
        maxPages: 1,
      })
      .limit(3)
      .stream();

    const results = [];
    for await (const delta of stream) {
      results.push(delta.item);
    }

    assert.equal(results.length, 3);
    assert.equal(results[0].name, 'Bulbasaur');
    assert.equal(results[0].number, '#0001');
  });


  it('should filter by type @fast', async () => {
    const stream = fox
      .config({ ai: 'openai:gpt-4o-mini', cache: testCache() })
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        questions:  {
          name: 'Pokemon name, starting with the first pokemon',
          number: 'Pokemon number, format: #XXXX',
          type: 'Pokemon type(s)',
        },
        maxPages: 1,
      })
      .limit(10)
      .filter('grass type')
      .stream();

    const results = [];
    for await (const delta of stream) {
      results.push(delta.item);
    }
    results.sort((a, b) => a.number.localeCompare(b.number));

    assert.equal(results.length, 3);
    assert.equal(results[0].name, 'Bulbasaur');
    assert.equal(results[0].number, '#0001');
  });
});

