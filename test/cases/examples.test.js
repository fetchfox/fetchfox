import os from 'os';
import fs from 'fs';
import assert from 'assert';
import process from 'node:process';
import { fox } from '../../src/index.js';

// Test the examples from README.md
describe('examples', function() {
  this.timeout(5 * 60 * 1000);

  it('should do basic example @run', async () => {
    const results = await fox
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        name: 'Pokemon name, starting with the first pokemon',
        number: 'Pokemon number, format: #XXXX',
      })
      .limit(3)
      .run(null, (delta) => {});

    console.log('results.items', results.items);

    assert.equal(results.items.length, 3);
    assert.equal(results.items[0].name, 'Bulbasaur');
    assert.equal(results.items[0].number, '#0001');
    assert.equal(results.items[1].name, 'Ivysaur');
    assert.equal(results.items[1].number, '#0002');
    assert.equal(results.items[2].name, 'Venusaur');
    assert.equal(results.items[2].number, '#0003');
  });

  it('should do streaming example @run', async () => {
    const stream = fox
      .init('https://pokemondb.net/pokedex/national')
      .extract({ name: 'Pokemon name', number: 'Pokemon number, format: #XXXX' })
      .limit(3)
      .stream();

    const results = [];
    for await (const delta of stream) {
      results.push(delta.item);
    }

    // stream.return();

    assert.equal(results.length, 3);
    assert.equal(results[0].name, 'Bulbasaur');
    assert.equal(results[0].number, '#0001');
  });
});

