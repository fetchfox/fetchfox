import { RemoteWorkflow } from '../workflow/RemoteWorkflow.js';

export const webfox = {
  config: (...args) => new RemoteWorkflow().config(...args),
  plan: (...args) => new RemoteWorkflow().plan(...args),
  // load: (data) => new Workflow().load(data),
  run: (...args) => new RemoteWorkflow().run(...args),
  // stream: (...args) => new Workflow().stream(...args),
  // step: (...args) => new Workflow().step(...args),
};
