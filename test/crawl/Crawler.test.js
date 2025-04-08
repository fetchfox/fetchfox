import assert from 'assert';
import { parse } from 'node-html-parser';
import { Crawler } from '../../src/crawl/Crawler.js';
import { testCache, setTestTimeout } from '../lib/util.js';

describe('Crawler', function() {

  setTestTimeout(this, 10 * 1000);

  it('should use pattern crawler @fast', async () => {
    const c = new Crawler({ cache: testCache() });
    const all = await c.all([
      'https://pokemondb.net/pokedex/*',
    ]);

    assert.ok(all.length > 1000, 'at least 1000');
    assert.ok(all.map(it => it.url).includes('https://pokemondb.net/pokedex/pikachu'));
  });

});
