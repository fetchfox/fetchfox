import assert from 'assert';
import os from 'os';
import { fox } from '../../src/index.js';
import { BaseStep } from '../../src/step/BaseStep.js';
import { testCache, setTestTimeout } from '../lib/util.js';

describe('BaseStep', function() {

  setTestTimeout(this);

  const batchSize = 3;
  const ai = 'openai:gpt-4o'

  it('should do exactly batch size @fast', async () => {
    const limit = batchSize;
    const wf = await fox
      .config({ cache: testCache(), ai })
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        batchSize,
        maxPages: 1,
        question: {
          name: 'Pokemon name, starting with the first pokemon',
          number: 'Pokemon number, format: #XXXX',
        }
      })
      .limit(limit)
      .plan();

    const results = await wf.run(null, (delta) => {});

    assert.equal(results.items.length, limit);
    assert.equal(results.items[0].name, 'Bulbasaur');
    assert.equal(results.items[0].number, '#0001');

    wf.abort();
  });

  it('should do over 2x batch size @fast', async () => {
    const limit = batchSize * 2 + 1;
    const wf = await fox
      .config({ cache: testCache(), ai })
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        batchSize,
        maxPages: 1,
        question: {
          name: 'Pokemon name, starting with the first pokemon',
          number: 'Pokemon number, format: #XXXX',
        }
      })
      .limit(limit)
      .plan();

    const results = await wf.run(null, (delta) => {});

    assert.equal(results.items.length, limit);
    assert.equal(results.items[0].name, 'Bulbasaur');

    wf.abort();
  });

  it('should do under batch size @fast', async () => {
    const limit = batchSize - 1;
    const wf = await fox
      .config({ cache: testCache(), ai })
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        batchSize,
        maxPages: 1,
        question: {
          name: 'Pokemon name, starting with the first pokemon',
          number: 'Pokemon number, format: #XXXX',
        }
      })
      .limit(limit)
      .plan();

    const results = await wf.run(null, (delta) => {});

    assert.equal(results.items.length, limit);
    assert.equal(results.items[0].name, 'Bulbasaur');
    assert.equal(results.items[0].number, '#0001');

    wf.abort();
  });

  it('should do limit=1 size @fast', async () => {
    const limit = 1;
    const wf = await fox
      .config({ cache: testCache(), ai })
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        batchSize,
        maxPages: 1,
        question: {
          name: 'Pokemon name, starting with the first pokemon',
          number: 'Pokemon number, format: #XXXX',
        }
      })
      .limit(limit)
      .plan();

    const results = await wf.run(null, (delta) => {});

    assert.equal(results.items.length, 1);
    assert.equal(results.items[0].name, 'Bulbasaur');
    assert.equal(results.items[0].number, '#0001');

    wf.abort();
  });

});
