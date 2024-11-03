import { fox } from '../fox/fox.js';
import { logger } from '../log/logger.js';

let workflow = null;

process.on('message', async ({ command, data }) => {
  logger.debug(`Child got message: command=${command} data=${data}`)
  switch (command) {
    case 'start':
      if (workflow != null) {
        throw new Error('already started');
      }

      console.log('GOT CONTEXT', data.context);

      workflow = await fox
        .config(data.context)
        .plan(...(data.workflow.steps));

        // .load({
        //   steps: data.workflow.steps,
        //   options: data.workflow.options,
        // });

      workflow.run(
        null,
        (data) => {
          process.send({ command: 'partial', data });
        })
        .then(data => {
          console.log('FINAL', data);
          process.send({ command: 'final', data });
        });
      break;

    case 'stop':
      process.send({ command: 'stop', data: workflow.out(true) });
      break;

    case 'exit':
      process.exit(0);
      break;
  }
});
