import { Workflow } from '../index.js';

export const fox = {
  config: (...args) => new Workflow().config(...args),
  plan: (...args) => new Workflow().plan(...args),
  load: (data) => new Workflow().load(data),
  run: (...args) => new Workflow().run(...args),
  stream: (...args) => new Workflow().stream(...args),
}
