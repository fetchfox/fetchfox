import assert from 'assert';
import os from 'os';
import { getFetcher, CodeGenExtractor } from '../../src/index.js';

describe('CodeGenExtractor', function() {
  this.timeout(3 * 60 * 1000);

  it('should learn @run', async () => {
    const url = 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/s962z2pfiq/https-www-united-com-en-us-fsr-choose-flights-f-SJC-t-NEW-20YORK-2C-20NY-2C-20US-20-ALL-20AIRPORTS-d-2025-01-10-tt-1-sc-7-px-1-taxng-1-newHP-True-clm-7-st-bestmatches-tqp-R.html';

    const questions = { flightNumber: 'get the flight number' };
    const cge = new CodeGenExtractor({ ai: 'openai:gpt-4o' });
    await cge.init(url, questions);
    await cge.learn();

    const all = await cge.all(url, questions);

    const expected = [
      { flightNumber: 'UA 1900' },
      { flightNumber: 'UA 1054' },
      { flightNumber: 'UA 2168' },
      { flightNumber: 'UA 1449' },
      { flightNumber: 'UA 1723' },
      { flightNumber: 'UA 1149' },
      { flightNumber: 'UA 1555' },
      { flightNumber: 'UA 649' },
      { flightNumber: 'UA 549' },
    ];

    assert.equal(
      JSON.stringify(all),
      JSON.stringify(expected));

  });

  it('should save and load @run', async () => {
    const url = 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/s962z2pfiq/https-www-united-com-en-us-fsr-choose-flights-f-SJC-t-NEW-20YORK-2C-20NY-2C-20US-20-ALL-20AIRPORTS-d-2025-01-10-tt-1-sc-7-px-1-taxng-1-newHP-True-clm-7-st-bestmatches-tqp-R.html';

    const start1 = (new Date()).getTime();
    const questions = { flightNumber: 'get the flight number' };
    const cge1 = new CodeGenExtractor({ kv: 'memory', ai: 'openai:gpt-4o' });
    await cge1.init(url, questions);
    await cge1.learn();
    const all1 = await cge1.all(url, questions);
    const took1 = (new Date()).getTime() - start1;

    await cge1.save();

    const fetcher = getFetcher();
    const doc = await fetcher.first(url);

    const start2 = (new Date()).getTime();
    const cge2 = new CodeGenExtractor({ kv: 'memory', ai: 'openai:gpt-4o' });
    await cge2.load(url, questions);
    const all2 = await cge2.all(doc, questions);
    const took2 = (new Date()).getTime() - start2;

    const expected = [
      { flightNumber: 'UA 1900' },
      { flightNumber: 'UA 1054' },
      { flightNumber: 'UA 2168' },
      { flightNumber: 'UA 1449' },
      { flightNumber: 'UA 1723' },
      { flightNumber: 'UA 1149' },
      { flightNumber: 'UA 1555' },
      { flightNumber: 'UA 649' },
      { flightNumber: 'UA 549' }
    ];

    assert.equal(
      JSON.stringify(all1),
      JSON.stringify(expected));

    assert.equal(
      JSON.stringify(all2),
      JSON.stringify(expected));

    assert.ok(took1 > 1000, 'code gen learning should take at least a second');
    assert.ok(took2 < 200, 'code gen execution from load should be fast');

  });

});
