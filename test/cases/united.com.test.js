import { logger } from '../../src/log/logger.js';
import assert from 'assert';
import process from 'node:process';
import { fox } from '../../src/index.js';

describe('united.com flight data', function() {
  this.timeout(60 * 1000);

  it('should scrape flights', async () => {
    const url = 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/s962z2pfiq/https-www-united-com-en-us-fsr-choose-flights-f-SJC-t-NEW-20YORK-2C-20NY-2C-20US-20-ALL-20AIRPORTS-d-2025-01-10-tt-1-sc-7-px-1-taxng-1-newHP-True-clm-7-st-bestmatches-tqp-R.html';

    const start = (new Date()).getTime();

    const out = await fox
      .init(url)
      .extract({
        departure: 'what is the departure airport code?',
        arrival: 'what is the departure airport code?',
        departureTime: 'what is the departure time? format; HH:MM am/pm',
        arrivalTime: 'what is the departure time? format; HH:MM am/pm',
        flightNumber: 'what is the flight number?',
        ticketPricesAndClasses: 'array of  ALL ticket prices, and ALL their associated classes. format: [["$XXX", "Class"], ["$XXX", "Class"], ...]',
        flightTime: 'flight time. format: XH XXM',
        layovers: 'either "nonstop" or airport code(s) of any layovers',
      })
      .limit(10)
      .run();

    const took = (new Date()).getTime() - start;

    console.log('items:', out.items);
    console.log('took', took);
  });

  it('should scrape flight numbers with code gen', async () => {
    const url = 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/s962z2pfiq/https-www-united-com-en-us-fsr-choose-flights-f-SJC-t-NEW-20YORK-2C-20NY-2C-20US-20-ALL-20AIRPORTS-d-2025-01-10-tt-1-sc-7-px-1-taxng-1-newHP-True-clm-7-st-bestmatches-tqp-R.html';

    const out = await fox
      .config({
        extractor: ['code-gen', { ai: 'openai:gpt-4o'}],
      })
      .init(url)
      .extract({
        flightNumber: 'what is the flight number?',
      })
      .run();

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

    assert.equal(out.items.length, expected.length);

    for (let i = 0; i < expected.length; i++) {
      const a = out.items[i];
      const e = expected[i];
      assert.equal(JSON.stringify(a), JSON.stringify(e));
    }
  });
});
