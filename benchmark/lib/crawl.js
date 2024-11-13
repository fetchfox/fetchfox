import { fox } from '../../src/index.js';
import { matrix } from '../lib.js';

export const runCrawlBenchmark = async (testCase, options) => {
  const configs = options?.configs || matrix();

  let results = [];
  for (const config of configs) {
    const wf = null; // TODO
    // TODO run the benchmark
    // TODO push result
  }
  return results;
}

  // it('should crawl for coins @bench', async () => {
  //   const configs = matrix();
  //   console.log('configs', configs);

  //   for (const config of configs) {
  //     const wf = await fox
  //       .config({ 
  //         // diskCache: os.tmpdir() + '/fetchfox-test-cache',
  //         diskCache: '/tmp/fetchfox-test-cache',
  //         ...config,
  //       })
  //       .init('https://ffcloud.s3.us-west-2.amazonaws.com/testdata/coinmarketcap.html')
  //       .crawl('find links to pages about coins')
  //       .plan();

  //     assert.equal(wf.steps[1].name(), 'crawl');
  //     wf.steps[1].limit = 50;

  //     const out = await wf.run();

  //     console.log('full output:');
  //     console.log(JSON.stringify(out, null, 2));
  //     const links = out.full[1].items;
  //     console.log(`found ${links.length} links using ${JSON.stringify(config)}`);

  //     // const links = out.full[1];
  //     // for (let { url } of links.items) {
  //     //   url = url.replace(
  //     //     'https://ffcloud.s3.us-west-2.amazonaws.com/',
  //     //     'https://coinmarketcap.com/');
  //     //   console.log('Found url:', url, '\tusing', config.ai);
  //     // }

  //     // somehow verify the links are correct:
  //     // - in this case, they should all have format like:
  //     //   https://coinmarketcap.com/currencies/...
  //   }
  // });
