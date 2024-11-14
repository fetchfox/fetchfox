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
