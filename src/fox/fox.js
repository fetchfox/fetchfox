import { Workflow } from '../workflow/Workflow.js';
import { stepNames } from '../step/index.js';

export const fox = {
  config: (...args) => new Workflow().config(...args),
  plan: (...args) => new Workflow().plan(...args),
  load: (data) => new Workflow().load(data),
  run: (...args) => new Workflow().run(...args),
  stream: (...args) => {
    console.log('???');
    return new Workflow().stream(...args);
  },
  step: (...args) => new Workflow().step(...args),
};

for (const stepName of stepNames) {
  fox[stepName] = (...args) => (new Workflow())[stepName](...args);
}
fox['init'] = fox['const'];
