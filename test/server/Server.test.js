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

    assert.equal(out[0].name, 'Bulbasaur');
    assert.equal(out[1].name, 'Ivysaur');
    assert.equal(out[2].name, 'Venusaur');
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
    assert.equal(out.length, 3);
    assert.equal(partials.length, 3);

    assert.equal(out[0].name, 'Bulbasaur');
    assert.equal(out[1].name, 'Ivysaur');
    assert.equal(out[2].name, 'Venusaur');

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
          console.log('TEST CLIENT GOT partial', partial.id);
          id = partial.id;
          partials.push(partial.item);
        });

    console.log('111');

    assert.ok(!!out);
    assert.equal(out.length, 1);
    assert.equal(partials.length, 1);

    assert.equal(out[0].name, 'Bulbasaur');
    // assert.equal(out[1].name, 'Ivysaur');
    // assert.equal(out[2].name, 'Venusaur');

    console.log('');
    console.log('');
    console.log('');
    console.log('');
    console.log('');
    console.log('');
    console.log('');
    console.log('Sub again and check results');
    console.log('id=>', id);

    const partials2 = [];
    const out2 = await rw.sub(id, () => {
    });

    console.log('out ', out);
    console.log('out2', out2);

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
          console.log('TEST CLIENT GOT partial', partial.id);
          id = partial.id;
          partials.push(partial.item);
        });

    const waitForNum = 5;
    for (let i = 0; i < 30; i++) {
      console.log('check', partials.length);
      await new Promise(ok => setTimeout(ok, 1000));
      if (partials.length >= waitForNum) break;
    }

    console.log('partials.length', id, partials.length);
    let stream2;
    const partials2 = await new Promise((ok) => {
      stream2 = rw.sub(id, (partial) => {
        console.log('22222 partial', partial);
        ok(partial);
      });
    });

    console.log('XXXXXXX partials2', partials2);
    assert.ok(partials2.items.length >= waitForNum, 'expect replay');
    assert.ok(partials2.items.length < 10, 'expect not finished');

    const out2 = await stream2;

    console.log('OUT2', out2);

    assert.equal(out2.length, 10);

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


  it('should stop', async () => {
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
          rw.stop();
        });

    s.close();

    assert.ok(!!out);
    assert.equal(out.length, 1);
  });
});
