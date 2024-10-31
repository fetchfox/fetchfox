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

  it('should crawl for pokemon', async () => {
    const json = {
      "steps": [
        {
          "name": "const",
          "args": {
            "items": [
              {
                "url": "https://pokemondb.net/pokedex/national"
              }
            ]
          }
        },
        {
          "name": "crawl",
          "args": {
            "query": "Look for links to individual Pokemon. Ignore links to advertisements and navigation links. Only Pokemon characters, no other pages.",
            "limit": "10"
          }
        },
        {
          "name": "extract",
          "args": {
            "questions": {
              "name": "What is the name of the Pokemon?",
              "type": "What is the type of the Pokemon?",
              "hp": "What is the HP of this Pokemon?",
              "url": "What is the URL of the Pokemon page? Format: Absolute URL"
            },
            "single": "true"
          }
        }
      ]
    };

    const out = await fox.run(json);
    console.log('out', out);

    const totalHp = out.items
      .map(pokemon => parseInt(pokemon.hp))
      .reduce((acc, x) => acc + x, 0);

    assert.ok(totalHp > 200 && totalHp < 10000, 'hp sanity check');
  });

  it('should run with playwright @run', async () => {
    const f = await fox
      .config({
        fetcher: ['playwright', { headless: true, requestWait: 1000 }],
      })
      .init('https://pokemondb.net/pokedex/national')
      .crawl({
        query: 'Find links to specific Pokemon characters',
        limit: 5,
      })
      .extract({
        name: 'What is the name of the pokemon?',
        number: 'What is the pokedex number?',
        stats: 'What are the basic stats of this pokemon?',
        single: true,
      })
      .limit(5);

    let count = 0;
    const out = await f.run(
      null,
      (partial) => {
        count++;
      });

    console.log('out', out);

    assert.equal(count, 5);
    assert.equal(out.items.length, 5);
    assert.equal(
      out.items.filter(item => item.name == 'Bulbasaur').length,
      1,
      'found Bulbasaur');
  });

});
