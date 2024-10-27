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

    await rw
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
          console.log('partial ===>', partial);
        });

    s.close();
  });

  it('should get same results as local', async () => {
    // const s = new Server();
    // await new Promise(ok => s.listen(7070, ok));

    const partials = [];
    const rwPartials = [];

    const run = fox
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
          results.push(partial);
        });

    // const rw = new RemoteWorkflow()
    //   .config({ host: 'http://127.0.0.1:7070' });
    // const rwRun = rw
    //   .init('https://pokemondb.net/pokedex/national')
    //   .extract({
    //     questions: {
    //       name: 'Pokemon name',
    //       type: 'Pokemon type',
    //       number: 'Pokedex number',
    //     },
    //     single: false })
    //   .limit(3)
    //   .run(
    //     null,
    //     (partial) => {
    //       rwPartials.push(partial);
    //     });

    await Promise.all([run]);

    // s.close();
  });
});
