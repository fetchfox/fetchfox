import assert from 'assert';
import { fox } from '../../src/index.js';
import { objectCartesian, benchmarkOptions } from '../lib.js';
import { matchesPatterns, runCrawlBenchmark } from '../lib/crawl.js'

const coinmarketEval = {
  includePatterns: new RegExp('^https://coinmarketcap.com/currencies/'),
  //includePatterns: new RegExp('currencies/'),
}

const coinmarketOptions = {
  url: 'https://ffcloud.s3.us-west-2.amazonaws.com/testdata/coinmarketcap.html',
  prompt: [
    'find lnks to pages about coins, and get their basic market data, including 24 hour trading volume',
    'get cryptocurrencies',
    'links to crypto',
  ],
  limit: 10,
}

function runEval(preds, patternEval) {
  const accuracy = preds
    .map(item => matchesPatterns(item, patternEval))
    .reduce((acc, correct) => 
        acc + (correct ? 1 : 0), 0) / preds.length;

  // Should probably prioritize either include or exclude patterns
  const plusScore = preds
    .map(item => matchesPatterns(item, {includePatterns: patternEval?.includePatterns}))
    .reduce((count, correct) =>
      count + (correct ? 1: 0), 0);
  const minusScore = preds
    .map(item => matchesPatterns(item, {includePatterns: patternEval?.excludePatterns}))
    .reduce((count, correct) =>
      count + (correct ? 1: 0), 0);
  const score = (plusScore - minusScore);

  const results = {
    accuracy: accuracy,
    score: score,
  }

  return results;
}

async function planCoinmarket(config) {
  const wf = await fox
  .config({ 
    diskCache: config.cacheDir,
    ...config,
  })
  .plan({
    url: config.url,
    prompt: config.prompt,
  });

  return wf;
}

async function crawlCoinmarket(wf, config) {
  // Verify it goes const -> crawl -> extract, and remove extract step
  assert.equal(wf.steps[1].name(), 'crawl');
  assert.equal(wf.steps.length, 3);
  wf.steps.pop();

  wf.steps[1].limit = config.limit;

  const out = await wf.run();
  const links = out.full[1];

  return links;
}

async function analyzeCoinmarket(links, config) {
  const preds = links.items.map(
    item => item.url.replace(
      'https://ffcloud.s3.us-west-2.amazonaws.com/',
      'https://coinmarketcap.com/')
  );
  console.log(config.ai, preds);
  const results = runEval(preds, coinmarketEval);
  
  return results;
}

describe('coinmarketcap.com', function() {
  this.timeout(5 * 60 * 1000);

  it('should crawl for coins @bench', async () => {
    let options = benchmarkOptions
    options = {...coinmarketOptions, ...options}
    console.log('options', options);

    // Get all combinations of options
    const configs = objectCartesian(options)
    const results = await runCrawlBenchmark(planCoinmarket, crawlCoinmarket, analyzeCoinmarket, configs)
    console.log(JSON.stringify(results, null, 2));
  });

});
