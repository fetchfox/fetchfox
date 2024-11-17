import assert from 'assert';
import { fox } from '../../src/index.js';
import { benchmarkOptions, matchesPatterns } from '../lib.js';
import { runCrawlBenchmarks } from '../lib/crawl.js'
import { runPlanBenchmarks } from '../lib/plan.js'

function runEvalScore(preds, patternEval) {
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
    length: preds.length,
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
    prompt: config.query,
  });

  return wf;
}

async function crawlPlan(wf, config) {
  // Verify it goes const -> crawl -> extract, and remove extract step
  assert.equal(wf.steps[1].name(), 'crawl');
  assert.equal(wf.steps.length, 3);
  wf.steps.pop();

  wf.steps[1].limit = config.limit;

  const out = await wf.run();
  const links = out.full[1];

  return links;
}

async function crawlSimple(config) {
  const out = await fox
    .config(config)
    .init(config.url)
    .crawl(config.query)
    .run();
  console.log(out);
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
  const results = runEvalScore(preds, config.evalData);
  
  return results;
}

describe('coinmarketcap.com', function() {
  this.timeout(5 * 60 * 1000);

  it('should crawl for coins @bench', async () => {
    let options = benchmarkOptions // option overrides, includes AIs to test
    const coinmarketOptions = {
      url: 'https://ffcloud.s3.us-west-2.amazonaws.com/testdata/coinmarketcap.html',
      query: [
        'find links to pages about coins',
        'coins',
        'tokens',
        'cryptocurrencies',
        'cryptos',
        'find crypto token pages',
      ],
      evalData: {
        includePatterns: new RegExp('^https://coinmarketcap.com/currencies/'),
      },
      limit: 10,
    }
    options = {...coinmarketOptions, ...options}
    console.log('options', options);

    const results = await runCrawlBenchmarks(crawlSimple, analyzeCoinmarket, options);
  });

  it('should plan and crawl for coins @bench', async () => {
    let options = benchmarkOptions // option overrides, includes AIs to test
    const coinmarketOptions = {
      url: 'https://ffcloud.s3.us-west-2.amazonaws.com/testdata/coinmarketcap.html',
      query: [
        'find lnks to pages about coins, and get their basic market data, including 24 hour trading volume',
        'get cryptocurrencies',
        'crawl links to crypto',
      ],
      evalData: {
        includePatterns: new RegExp('^https://coinmarketcap.com/currencies/'),
      },
      limit: 10,
    }
    options = {...coinmarketOptions, ...options}
    console.log('options', options);

    const results = runPlanBenchmarks(planCoinmarket, crawlPlan, analyzeCoinmarket, options);
  });

});
