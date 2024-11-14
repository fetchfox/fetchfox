import assert from 'assert';
import os from 'os';
import { getFetcher, CodeGenExtractor } from '../../src/index.js';

const flightUrls = [
  'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/s962z2pfiq/https-www-united-com-en-us-fsr-choose-flights-f-SJC-t-NEW-20YORK-2C-20NY-2C-20US-20-ALL-20AIRPORTS-d-2025-01-10-tt-1-sc-7-px-1-taxng-1-newHP-True-clm-7-st-bestmatches-tqp-R.html',
  'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/yzpq29gvn9/https-www-united-com-en-us-fsr-choose-flights-f-LAX-t-SEA-d-2024-12-10-tt-1-sc-7-px-1-taxng-1-newHP-True-clm-7-st-bestmatches-tqp-R.html',
  'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/mdbksbgemo/https-www-united-com-en-us-fsr-choose-flights-f-MIA-t-EWR-d-2024-11-30-tt-1-sc-7-px-1-taxng-1-newHP-True-clm-7-st-bestmatches-tqp-R.html',
  'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/9riqlklkp6/https-www-united-com-en-us-fsr-choose-flights-f-MIA-t-DFW-d-2025-02-20-tt-1-sc-7-px-1-taxng-1-newHP-True-clm-7-st-bestmatches-tqp-R.html',
  'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/19numlv557/https-www-united-com-en-us-fsr-choose-flights-f-DFW-t-SEA-d-2024-12-12-tt-1-sc-7-px-1-taxng-1-newHP-True-clm-7-st-bestmatches-tqp-R.html',
];

describe('CodeGenExtractor', function() {
  this.timeout(3 * 60 * 1000);

  it('should learn @run', async () => {
    const urls = flightUrls;

    const questions = {
      departureTime: 'Time that the flight is departing. Format: H:MM AM/PM',
      arrivalTime: 'Time that the flight is arriving. Format: H:MM AM/PM',
    };
    const cge = new CodeGenExtractor({ ai: 'openai:gpt-4o' });
    await cge.init(urls, questions);
    await cge.learn();

    const all = await cge.all(urls[0], questions);

    console.log(all);

    const expected = [
      { departureTime: '7:15 AM', arrivalTime: '3:42 PM' },
      { departureTime: '9:00 AM', arrivalTime: '5:20 PM' },
      { departureTime: '10:45 AM', arrivalTime: '7:26 PM' },
      { departureTime: '12:55 PM', arrivalTime: '9:21 PM' },
      { departureTime: '2:45 PM', arrivalTime: '11:06 PM' },
      { departureTime: '4:40 PM', arrivalTime: '1:16 AM' },
      { departureTime: '9:25 PM', arrivalTime: '5:59 AM' },
      // TODO: all all the correct times
    ];

    assert.equal(
      JSON.stringify(all.slice(0, expected.length)),
      JSON.stringify(expected));

  });

  it('should save and load @run', async () => {
    const urls = flightUrls;
    const fetcher = getFetcher();

    const start1 = (new Date()).getTime();
    const questions = {
      departureTime: 'Time that the flight is departing. Format: H:MM AM/PM',
      arrivalTime: 'Time that the flight is arriving. Format: H:MM AM/PM',
    };
    const cge1 = new CodeGenExtractor({ kv: 'memory', ai: 'openai:gpt-4o' });
    await cge1.init(urls, questions);
    await cge1.learn();
    const all1 = await cge1.all(urls[0], questions);
    const took1 = (new Date()).getTime() - start1;

    await cge1.save();
    const doc = await fetcher.first(urls[0]);

    const start2 = (new Date()).getTime();
    const cge2 = new CodeGenExtractor({ kv: 'memory', ai: 'openai:gpt-4o' });
    await cge2.load(urls, questions);
    const all2 = await cge2.all(doc, questions);
    const took2 = (new Date()).getTime() - start2;

    const expected = [
      { departureTime: '7:15 AM', arrivalTime: '3:42 PM' },
      { departureTime: '9:00 AM', arrivalTime: '5:20 PM' },
      { departureTime: '10:45 AM', arrivalTime: '7:26 PM' },
      { departureTime: '12:55 PM', arrivalTime: '9:21 PM' },
      { departureTime: '2:45 PM', arrivalTime: '11:06 PM' },
      { departureTime: '4:40 PM', arrivalTime: '1:16 AM' },
      { departureTime: '9:25 PM', arrivalTime: '5:59 AM' },
      // TODO: all all the correct times
    ];

    assert.equal(
      JSON.stringify(all1.slice(0, expected.length)),
      JSON.stringify(expected));

    assert.equal(
      JSON.stringify(all2.slice(0, expected.length)),
      JSON.stringify(expected));

    console.log('took1', took1);
    console.log('took2', took2);

    assert.ok(took1 > 1000, 'code gen learning should take at least a second');
    assert.ok(took2 < 200, 'code gen execution from load should be fast');

  });

});
