import assert from 'assert';
import { parse } from 'node-html-parser';
import { PatternCrawler } from '../../src/crawl/PatternCrawler.js';
import { testCache, setTestTimeout } from '../lib/util.js';

describe('PatternCrawler', function() {

  setTestTimeout(this, 10 * 1000);

  it('should find patterns @fast', async () => {
    const pc = new PatternCrawler({ cache: testCache() });
    const all = await pc.all([
      'https://pokemondb.net/pokedex/*',
    ]);
    console.log('all', all);
    assert.ok(all.length > 1000, 'at least 1000');
    assert.ok(all.map(it => it.url).includes('https://pokemondb.net/pokedex/pikachu'));
  });

  it('should find multiple patterns @fast', async () => {
    const pc = new PatternCrawler({ cache: testCache() });
    const all = await pc.all([
      'https://pokemondb.net/move/*',
      'https://pokemondb.net/type/*',
    ]);
    console.log('all', all);
    assert.ok(all.length > 500, 'at least 500');
  });

  it('should pull html @fast', async () => {
    const pc = new PatternCrawler({ cache: testCache() });
    const gen = pc.run(
      ['https://pokemondb.net/pokedex/*'],
      { pull: true });

    let i = 0;
    for await (const result of gen) {
      if (i++ > 3) break;
      assert.ok(result.html.length > 100, 'has html');
      assert.ok(result.text.length > 100, 'has text');
      assert.ok(result.markdown.length > 100, 'has markdown');
    }
  });

});
