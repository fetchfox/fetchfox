import { RemoteWorkflow } from '../workflow/RemoteWorkflow.js';

export const webfox = {
  config: (...args) => new RemoteWorkflow().config(...args),
  plan: (...args) => new RemoteWorkflow().plan(...args),
  sub: (...args) => new RemoteWorkflow().sub(...args),
  start: (...args) => new RemoteWorkflow().start(...args),
  stop: (...args) => new RemoteWorkflow().stop(...args),
  run: (...args) => new RemoteWorkflow().run(...args),

  // stream: (...args) => new Workflow().stream(...args),
  // step: (...args) => new Workflow().step(...args),
};
