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
          partials.push(partial.item);
        });

    s.close();

    assert.ok(!!out.items);
    assert.equal(out.items.length, 3);
    assert.equal(partials.length, 3);

    assert.equal(out.items[0].name, 'Bulbasaur');
    assert.equal(out.items[1].name, 'Ivysaur');
    assert.equal(out.items[2].name, 'Venusaur');
  });

  it('should start and sub', async () => {
    const s = new Server();
    await new Promise(ok => s.listen(7070, ok));

    const rw = new RemoteWorkflow()
      .config({ host: 'http://127.0.0.1:7070' });

    const partials = [];
    const id = await rw
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        questions: {
          name: 'Pokemon name',
          type: 'Pokemon type',
          number: 'Pokedex number',
        },
        single: false })
      .limit(3)
      .start();

    const out = await rw.sub(
      id,
      (partial) => {
        partials.push(partial.item);
      });

    assert.ok(!!out);
    assert.equal(out.items.length, 3);
    assert.equal(partials.length, 3);

    assert.equal(out.items[0].name, 'Bulbasaur');
    assert.equal(out.items[1].name, 'Ivysaur');
    assert.equal(out.items[2].name, 'Venusaur');

    s.close();

  });

  it('should replay results on re-connect', async () => {
    const s = new Server();
    await new Promise(ok => s.listen(7070, ok));

    const rw = new RemoteWorkflow()
      .config({ host: 'http://127.0.0.1:7070' });

    let id;
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
      .limit(1)
      .run(
        null,
        (partial) => {
          id = partial.id;
          partials.push(partial.item);
        });


    assert.ok(!!out);
    assert.equal(out.items.length, 1);
    assert.equal(partials.length, 1);

    assert.equal(out.items[0].name, 'Bulbasaur');

    const partials2 = [];
    const out2 = await rw.sub(id, () => {
    });


    assert.equal(
      JSON.stringify(out2),
      JSON.stringify(out));

    assert.equal((s.store[id] || []).length, 0);

    s.close();
  });

  it('should partial replay results on re-connect', async () => {
    const s = new Server();
    await new Promise(ok => s.listen(7070, ok));

    const rw = new RemoteWorkflow()
      .config({ host: 'http://127.0.0.1:7070' });

    let id;
    const partials = [];

    // Do *not* wait for full results
    rw
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        questions: {
          name: 'Pokemon name',
          type: 'Pokemon type',
          number: 'Pokedex number',
        },
        single: false })
      .limit(10)
      .run(
        null,
        (partial) => {
          id = partial.id;
          partials.push(partial.item);
        });

    const waitForNum = 5;
    for (let i = 0; i < 30; i++) {
      await new Promise(ok => setTimeout(ok, 1000));
      if (partials.length >= waitForNum) break;
    }

    let stream2;
    const partials2 = await new Promise((ok) => {
      stream2 = rw.sub(id, (partial) => {
        ok(partial);
      });
    });

    assert.ok(partials2.items.length >= waitForNum, 'expect replay');
    assert.ok(partials2.items.length < 10, 'expect not finished');

    const out2 = await stream2;

    assert.equal(out2.items.length, 10);

    s.close();
    
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

    assert.equal(out.items.length, 3);
    assert.equal(out.items[0].name, 'Bulbasaur');
    assert.equal(out.items[1].name, 'Ivysaur');
    assert.equal(out.items[2].name, 'Venusaur');
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


  it('should stop', async () => {
    const s = new Server();
    await new Promise(ok => s.listen(7070, ok));

    const rw = new RemoteWorkflow()
      .config({ host: 'http://127.0.0.1:7070' });

    let stopOut;
    const partials = [];
    const final = await rw
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
        async (partial) => {
          partials.push(partial.item);
          stopOut = await rw.stop();
        });

    s.close();

    assert.equal(final.items.length, 1);
    assert.equal(final.items[0].name, 'Bulbasaur');
    assert.equal(final.full[2].items[0].name, 'Bulbasaur');

    assert.ok(final.full[0].done);
    assert.ok(final.full[1].done);
    assert.ok(final.full[2].done);

    assert.equal(stopOut.items.length, 1);
    assert.equal(
      JSON.stringify(final.items, null, 2),
      JSON.stringify(stopOut.items, null, 2))
  });

  it('should be able to publish all steps', async () => {
    const s = new Server();
    await new Promise(ok => s.listen(7070, ok));

    const rw = new RemoteWorkflow()
      .config({
        host: 'http://127.0.0.1:7070',
        publishAllSteps: true,
      });

    let count = 0;
    const final = await rw
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
        async (partial) => {
          count++
        });

    s.close();

    assert.equal(count, 9);
  });
});
