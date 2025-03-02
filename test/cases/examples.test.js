import os from 'os';
import fs from 'fs';
import assert from 'assert';
import process from 'node:process';
import { fox } from '../../src/index.js';
import { testCache, setTestTimeout } from '../lib/util.js';

// Test the examples from README.md
describe('examples', function() {

  setTestTimeout(this);

  it('should do basic example @fast', async () => {
    const cases = [
      { ai: 'openai:gpt-4o-mini' },
      { ai: 'openrouter:openai/gpt-4o' },
    ];

    for (const { ai } of cases) {
      const wf = await fox
        .config({
          ai,
          cache: testCache(),
          prefix: 'jobid=123',
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
});

