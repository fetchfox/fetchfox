import assert from 'assert';
import { fox } from '../../src/index.js';
import { Server } from '../../src/server/Server.js';
import { RemoteWorkflow } from '../../src/workflow/RemoteWorkflow.js';

describe('Server', function() {
  this.timeout(3 * 60 * 1000); // 3 minutes

  it('should serve and run', async () => {
    const s = new Server();
    await new Promise(ok => s.listen(7070, ok));

    const rw = new RemoteWorkflow()
      .config({ host: 'http://127.0.0.1:7070' });

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
        });

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
});
