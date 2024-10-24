import os from 'os';
import fs from 'fs';
import assert from 'assert';
import process from 'node:process';
import { fox } from '../../src/index.js';

process.on('unhandledRejection', async (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  process.exit(1);
});

describe('pokemondb.net', function() {
  this.timeout(5 * 60 * 1000);

  it('should stream', async () => {
    const f = await fox
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        name: 'What is the name of the pokemon?',
        number: 'What is the pokedex number?',
      })
      .limit(3);

    const stream = f.stream();

    const all = [];
    for await (const { item } of stream) {
      all.push(item);
    }

    assert.equal(all.length, 3);
    assert.equal(all[0].name, 'Bulbasaur');
    assert.equal(all[0].number, '#0001');
    assert.equal(all[1].name, 'Ivysaur');
    assert.equal(all[1].number, '#0002');
    assert.equal(all[2].name, 'Venusaur');
    assert.equal(all[2].number, '#0003');
  });
});
