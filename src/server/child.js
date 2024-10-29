import { fox } from '../fox/fox.js';

let workflow = null;

process.on('message', async ({ command, data }) => {
  switch (command) {
    case 'start':
      if (workflow != null) {
        throw new Error('already started');
      }

      workflow = await fox.config(data.context).plan(...(data.workflow.steps));
      workflow.run(
        null,
        (data) => {
          process.send({ command: 'partial', data });
        })
        .then(data => {
          process.send({ command: 'final', data });
          process.exit(0);
        });
      break;

    case 'stop':
      process.send({ command: 'stop', data: workflow.out(true) });
      process.exit(0);
      break;
  }
});
