import { RemoteWorkflow } from '../workflow/RemoteWorkflow.js';

export const webfox = {
  config: (...args) => new RemoteWorkflow().config(...args),
  plan: (...args) => new RemoteWorkflow().plan(...args),
  describe: (data) => new RemoteWorkflow().load(data).describe(),
  sub: (...args) => new RemoteWorkflow().sub(...args),
  start: (...args) => new RemoteWorkflow().start(...args),
  stop: (...args) => new RemoteWorkflow().stop(...args),
  run: (...args) => new RemoteWorkflow().run(...args),
};
