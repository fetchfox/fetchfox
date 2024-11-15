import { fox } from '../fox/fox.js';
import { logger } from '../log/logger.js';

let workflow = null;

process.on('unhandledRejection', async (e, p) => {
  logger.error(`Child.js unhandled Rejection at: ${e}`);
  logger.error(`Child.js unhandled stack: ${e.stack}`);

  const serialize = (e) => {
    if (!(e instanceof Error)) {
      return e;
    }

    return {
      name: e.name,
      message: e.message,
      stack: e.stack,
      ...(e.code && { code: e.code }),
      ...(e.details && { details: e.details }),
    };
  }

  await process.send({ command: 'error', data: serialize(e) });
  process.exit(1);
});

process.on('message', async ({ command, data }) => {
  logger.debug(`Child got message: command=${command} data=${data}`)
  switch (command) {
    case 'start':
      if (workflow != null) {
        throw new Error('already started');
      }

      workflow = await fox
        .config(data.context)
        .plan(...(data.workflow.steps));

      workflow.run(
        null,
        (data) => {
          process.send({ command: 'partial', data });
        })
        .then(data => {
          process.send({ command: 'final', data });
        });
      break;

    case 'stop':
      process.send({ command: 'stop', data: workflow.out(true) });
      break;

    case 'exit':
      logger.info(`Child exiting`);
      process.exit(0);
      break;
  }
});
