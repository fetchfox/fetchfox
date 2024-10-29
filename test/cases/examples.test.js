// Test the examples from README.md

import os from 'os';
import fs from 'fs';
import assert from 'assert';
import process from 'node:process';
import { fox } from '../../src/index.js';

process.on('unhandledRejection', async (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  process.exit(1);
});

describe('examples', function() {
  this.timeout(5 * 60 * 1000);

  it('should do basic example @run', async () => {
    const results = await fox
      .init('https://pokemondb.net/pokedex/national')
      .extract({ name: 'Pokemon name', number: 'Pokemon number' })
      .limit(3)
      .run(null, (delta) => {});

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
      .extract({ name: 'Pokemon name', number: 'Pokemon number' })
      .limit(3) // TODO: https://github.com/fetchfox/fetchfox/issues/16
      .stream();

    const results = [];
    for await (const delta of stream) {
      results.push(delta.item);
    }

    stream.return();

    assert.equal(results.length, 3);
    assert.equal(results[0].name, 'Bulbasaur');
    assert.equal(results[0].number, '#0001');
  });
});

