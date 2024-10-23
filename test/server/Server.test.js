import assert from 'assert';
import { Server } from '../../src/server/Server.js';
import { RemoteWorkflow } from '../../src/workflow/RemoteWorkflow.js';

describe('Server', function() {
  this.timeout(3 * 60 * 1000); // 3 minutes

  it('should serve and run', async () => {
    const s = new Server();
    await new Promise(ok => s.listen(9090, ok));
    console.log('started server');

    const rw = new RemoteWorkflow()
      .config({ host: 'http://localhost:9090' });

    const plan = await rw
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        questions: {
          name: 'Pokemon name',
          type: 'Pokemon type',
          number: 'Pokedex number',
        },
        single: false })
      .plan();

    console.log('plan', plan);

    s.close();
  });
});
