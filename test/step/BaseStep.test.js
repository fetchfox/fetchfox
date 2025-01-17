import assert from 'assert';
import os from 'os';
import { fox } from '../../src/index.js';
import { BaseStep } from '../../src/step/BaseStep.js';
import { testCache } from '../lib/util.js';

describe('BaseStep', function () {
  this.timeout(60 * 1000);

  const batchSize = 3;

  it('should do exactly batch size @run @fast', async () => {
    const limit = batchSize;
    const results = await fox
      .config({ cache: testCache() })
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        batchSize,
        name: 'Pokemon name, starting with the first pokemon',
        number: 'Pokemon number, format: #XXXX',
      })
      .limit(limit)
      .run(null, (delta) => {});

    assert.equal(results.items.length, limit);
    assert.equal(results.items[0].name, 'Bulbasaur');
    assert.equal(results.items[0].number, '#0001');
  });

  it('should do over 2x batch size @run @fast', async () => {
    const limit = batchSize * 2 + 1;
    const results = await fox
      .config({ cache: testCache() })
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        batchSize,
        name: 'Pokemon name, starting with the first pokemon',
        number: 'Pokemon number, format: #XXXX',
      })
      .limit(limit)
      .run(null, (delta) => {});

    assert.equal(results.items.length, limit);
    assert.equal(results.items[0].name, 'Bulbasaur');
  });

  it('should do under batch size @run @fast', async () => {
    const limit = batchSize - 1;
    const results = await fox
      .config({ cache: testCache() })
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        batchSize,
        name: 'Pokemon name, starting with the first pokemon',
        number: 'Pokemon number, format: #XXXX',
      })
      .limit(limit)
      .run(null, (delta) => {});

    assert.equal(results.items.length, limit);
    assert.equal(results.items[0].name, 'Bulbasaur');
    assert.equal(results.items[0].number, '#0001');
  });

  it('should do limit=1 size @run @fast', async () => {
    const limit = 1;
    const results = await fox
      .config({ cache: testCache() })
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        batchSize,
        name: 'Pokemon name, starting with the first pokemon',
        number: 'Pokemon number, format: #XXXX',
      })
      .limit(limit)
      .run(null, (delta) => {});

    assert.equal(results.items.length, 1);
    assert.equal(results.items[0].name, 'Bulbasaur');
    assert.equal(results.items[0].number, '#0001');
  });
});
