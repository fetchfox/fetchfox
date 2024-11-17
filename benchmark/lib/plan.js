import { objectCartesian } from '../lib.js';

export const runPlanBenchmark = async (plan, crawl, analyze, config) => {

  let res = {};
  let planDuration = 0.0;
  let crawlDuration = 0.0;
  try {
    const planStartTime = performance.now();
    const wf = await plan(config);
    planDuration = performance.now() - planStartTime;
    console.log('wf', JSON.stringify(wf.dump(), null, 2));

    const crawlStartTime = performance.now();
    const preds = await crawl(wf, config);
    crawlDuration = performance.now() - crawlStartTime;

    res = await analyze(preds, config);
  } catch (err) {
    console.log(err);
    return {
      failure: true,
      config: config,
    }
  }
  
  return {
    ...res,
    failure: false,
    planDuration: planDuration,
    crawlDuration: crawlDuration,
    config: config,
  }
}

// benchmarks plan/crawl functions with analyze function
// will operate on all combinations of lists in options, but not fixedOptions
export const runPlanBenchmarks = async (plan, crawl, analyze, options, fixedOptions = {}) => {
  const configs = objectCartesian(options, fixedOptions);

  let results = [];
  let result = {};
  for (const config of configs) {
      result = await runPlanBenchmark(plan, crawl, analyze, config);
      results.push(result);
  }

  console.log(JSON.stringify(results, null, 2));
  return results;
}
