import {
  DiskCache,
  Workflow,
  Planner,

  getAI,
} from '../../src/index.js';

async function* stream(...args) {
  const cache = new DiskCache(
    '/tmp/fetchfox_cache',
    { ttls: 10 * 24 * 3600 });
  const ai = getAI('openai:gpt-4o-mini', { cache });   
 
  const planner = new Planner({ ai, cache, limit: 2 });
  const steps = await planner.plan(args);
  const flow = new Workflow(steps);
  const stream = flow.stream();

  for await (const r of stream) {
    console.log(`Step ${r.index} delta: ${r.delta}`);
    if (r.index == steps.length - 1) {
      yield Promise.resolve(r.delta);
    }
  }
}

export const fox = {
  stream,

  run: async (...args) => {
    const result = [];
    for await (const r of stream(...args)) {
      result.push(r);
    }
    return result;
  }
}
