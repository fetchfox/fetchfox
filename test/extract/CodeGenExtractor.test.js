import assert from 'assert';
import os from 'os';
import { CodeGenExtractor } from '../../src/index.js';

describe('CodeGenExtractor', function() {
  this.timeout(60 * 1000);

  it('should learn', async () => {
    const url = 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/s962z2pfiq/https-www-united-com-en-us-fsr-choose-flights-f-SJC-t-NEW-20YORK-2C-20NY-2C-20US-20-ALL-20AIRPORTS-d-2025-01-10-tt-1-sc-7-px-1-taxng-1-newHP-True-clm-7-st-bestmatches-tqp-R.html';
    console.log('url', url);

    const cge = new CodeGenExtractor({ ai: 'openai:gpt-4o' });
    await cge.init(url, { flightNumber: 'get the flight number' });
    await cge.learn();
    console.log('cge state:', cge.state);
  });

});
