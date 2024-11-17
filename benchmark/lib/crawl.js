import { objectCartesian } from '../lib.js';

export const runCrawlBenchmark = async (crawl, analyze, config) => {
  let res = {};
  let crawlDuration = 0.0;
  try {
    const crawlStartTime = performance.now();
    const preds = await crawl(config);
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
    crawlDuration: crawlDuration,
    config: config,
  }
}

// benchmarks crawl function with analyze function
// will operate on all combinations of lists in options, but not fixedOptions
export const runCrawlBenchmarks = async (crawl, analyze, options, fixedOptions = {}) => {
  const configs = objectCartesian(options, fixedOptions);

  let results = [];
  let result = {};
  for (const config of configs) {
    result = await runCrawlBenchmark(crawl, analyze, config);
    results.push(result);
  }

  console.log(JSON.stringify(results, null, 2));
  return results;
}
