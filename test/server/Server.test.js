import assert from 'assert';
import { Server } from '../../src/server/Server.js';
import { RemoteWorkflow } from '../../src/workflow/RemoteWorkflow.js';

describe('Server', function() {
  this.timeout(3 * 60 * 1000); // 3 minutes

  it('should serve and run', async () => {
    const s = new Server();
    await new Promise(ok => s.listen(7070, ok));
    console.log('started server');

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

    // console.log('PLAN:', rw.steps);
    // await rw.run();
    //   .plan();

    console.log('run done');

    // s.close();
  });
});
