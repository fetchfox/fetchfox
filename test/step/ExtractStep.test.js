import assert from 'assert';
import os from 'os';
import { fox } from '../../src/index.js';
import { testCache } from '../lib/util.js';

describe('ExtractStep', function() {
  this.timeout(60 * 1000);

  it('should supplement items with subsequent extractions @run', async () => {
    const f = await fox
      .config({ cache: testCache() })
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        url: 'What is the URL of this pokemon',
        name: 'What is the name of the pokemon?',
        number: 'What is the pokedex number?',
      })
      .extract({
        height: 'What is the height of this pokemon?',
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
  });

});
