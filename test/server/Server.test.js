import assert from 'assert';
import { fox } from '../../src/index.js';
import { webfox } from '../../src/web.js';
import { Server } from '../../src/server/Server.js';
import { RemoteWorkflow } from '../../src/workflow/RemoteWorkflow.js';

describe('Server', function() {
  this.timeout(3 * 60 * 1000); // 3 minutes

  it('should serve and run', async () => {
    const s = new Server();
    await new Promise(ok => s.listen(7070, ok));

    const rw = new RemoteWorkflow()
      .config({ host: 'http://127.0.0.1:7070' });

    const partials = [];
    const out = await rw
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        questions: {
          name: 'Pokemon name',
          type: 'Pokemon type',
          number: 'Pokedex number',
        },
        single: false })
      .limit(3)
      .run(
        null,
        (partial) => {
          console.log('CLIENT PARTIAL: -->', partial);
          partials.push(partial.item);
        });

    s.close();
    console.log('CLOSED! out --> ', out);
    console.log('CLOSED! partials --> ', partials);

    assert.ok(!!out);
    assert.equal(out.length, 3);
    assert.equal(partials.length, 3);

    return;

    assert.equal(out[0].name, 'Bulbasaur');
    assert.equal(out[1].name, 'Ivysaur');
    assert.equal(out[2].name, 'Venusaur');
  });

  it('should run json', async () => {
    const s = new Server();
    await new Promise(ok => s.listen(7070, ok));

    const wf = webfox;
    const out = await wf
      .config({ host: 'http://127.0.0.1:7070' })
      .run(
        {
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
              "name": "extract",
              "args": {
                "questions": {
                  "name": "What is the name of the Pokémon?",
                  "type": "What is the type of the Pokémon?"
                },
                "single": false
              }
            },
            {
              "name": "limit",
              "args": {
                "limit": "3"
              }
            },
          ]
        },
        (partial) => {});

    s.close();

    assert.equal(out.length, 3);
    assert.equal(out[0].name, 'Bulbasaur');
    assert.equal(out[1].name, 'Ivysaur');
    assert.equal(out[2].name, 'Venusaur');
  });


  it('should get same results as local', async () => {
    const s = new Server();
    await new Promise(ok => s.listen(7070, ok));

    const partials = [];
    const rwPartials = [];

    const run = fox
      // .config({ diskCache: '/tmp/ff' })
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        questions: {
          name: 'Pokemon name',
          type: 'Pokemon type',
          number: 'Pokedex number',
        },
        single: false })
      .limit(3)
      .run(
        null,
        (partial) => {
          partials.push(partial.item);
        });

    const rw = new RemoteWorkflow()
      .config({ host: 'http://127.0.0.1:7070' });
    const rwRun = rw
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        questions: {
          name: 'Pokemon name',
          type: 'Pokemon type',
          number: 'Pokedex number',
        },
        single: false })
      .limit(3)
      .run(
        null,
        (partial) => {
          rwPartials.push(partial.item);
        });

    await Promise.all([run, rwRun]);

    s.close();

    assert.equal(partials.length, 3);
    assert.equal(partials[0].name, 'Bulbasaur');
    assert.equal(partials[1].name, 'Ivysaur');
    assert.equal(partials[2].name, 'Venusaur');

    assert.equal(rwPartials.length, 3);
    assert.equal(rwPartials[0].name, 'Bulbasaur');
    assert.equal(rwPartials[1].name, 'Ivysaur');
    assert.equal(rwPartials[2].name, 'Venusaur');

    assert.equal(rwPartials.length, partials.length);
    assert.equal(rwPartials[0].name, partials[0].name);
    assert.equal(rwPartials[1].name, partials[1].name);
    assert.equal(rwPartials[2].name, partials[2].name);
  });

  it('should plan', async () => {
    const s = new Server();
    await new Promise(ok => s.listen(7070, ok));

    const rw = new RemoteWorkflow()
      .config({ host: 'http://127.0.0.1:7070' });
    const workflow = await rw.plan('https://pokemondb.net/pokedex/national find links to pokemon pages and extract names');

    s.close();

    assert.equal(workflow.steps.length, 3);
    assert.equal(workflow.steps[0].name, 'const');
    assert.equal(workflow.steps[1].name, 'crawl');
    assert.equal(workflow.steps[2].name, 'extract');
  });
});
