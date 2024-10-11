import {
  Workflow,
  Planner,
  Context,
} from '../index.js';

async function* stream(...args) {
 
  const planner = new Planner(fox.ctx);
  const steps = await planner.plan(args);
  const flow = new Workflow({ ...fox.ctx, steps });
  const stream = flow.stream();

  for await (const r of stream) {
    console.log(`Step ${r.index} delta: ${r.delta}`);
    if (r.index == steps.length - 1) {
      yield Promise.resolve(r.delta);
    }
  }
}

export const fox = {
  config: (args) => {
    fox.ctx = new Context(args);
    return fox;
  },

  stream,

  plan: async (...args) => {
    const planner = new Planner(fox.ctx);
    const steps = await planner.plan(args);
    const flow = new Workflow({ ...fox.ctx, steps });
    return flow;
  },

  load: (data) => {
    const flow = new Workflow(data);
    return flow;
  },

  run: async (...args) => {
    const result = [];
    for await (const r of stream(...args)) {
      result.push(r);
    }
    return result;
  }
}
