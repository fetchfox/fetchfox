import assert from 'assert';
import os from 'os';
import { fox } from '../../src/index.js';
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

  it('should learn @disabled', async () => {
    const urls = flightUrls;

    const questions = {
      departureTime: 'Time that the flight is departing. Format: H:MM AM/PM',
      arrivalTime: 'Time that the flight is arriving. Format: H:MM AM/PM',
    };
    const cge = new CodeGenExtractor({ ai: 'openai:gpt-4o' });
    await cge.init(urls, questions);
    await cge.learn();

    const all = await cge.all(urls[0], questions);


    const expected = [
      { departureTime: '7:15 AM', arrivalTime: '3:42 PM' },
      { departureTime: '9:00 AM', arrivalTime: '5:20 PM' },
      { departureTime: '10:45 AM', arrivalTime: '7:26 PM' },

      // { departureTime: '12:55 PM', arrivalTime: '9:21 PM' },
      // { departureTime: '2:45 PM', arrivalTime: '11:06 PM' },
      // { departureTime: '4:40 PM', arrivalTime: '1:16 AM' },
      // { departureTime: '9:25 PM', arrivalTime: '5:59 AM' },

      // TODO: check all the correct times, above is just sanity check
    ];

    assert.equal(
      JSON.stringify(all.slice(0, expected.length)),
      JSON.stringify(expected));

  });

  it('should learn oyl @run', async () => {
    const urls = ['https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/irpyrvx78l/https-ownyourlabs-com-shop-oyl-.html'];

    const questions = {
      product_name: 'What is the name of this product?',
      price: 'What is the price of this product? Format: $XX.XX'
    };
    const cge = new CodeGenExtractor();
    await cge.init(urls, questions);
    await cge.learn();

    const out = await cge.all(urls[0], questions);
    assert.equal(out.length, 161);
  });

  it('should run workflow with code gen oyl @run', async () => {
    const url = 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/irpyrvx78l/https-ownyourlabs-com-shop-oyl-.html';
    const wf = await fox
      .config({
        extractor: 'code-gen',
      })
      .init(url)
      .extract({
        product_name: 'What is the name of this product?',
        price: 'What is the price of this product? Format: $XX.XX',
      });

    const out = await wf.run();

    assert.equal(out.items.length, 161);
  });


  it('should run workflow with crawl and code gen pokemon @run', async () => {
    const wf = await fox
      .config({
        extractor: 'code-gen',
      })
      .init('https://pokemondb.net/pokedex/national')
      .crawl({
        query: 'Find links to pages of individual Pokemon. Do NOT find the /all, the /national page, the /type pages, etc.',
        limit: 20,
      })
      .extract({
        name: 'What is the name of this pokemon?',
        hp: 'What is the HP of this pokemon?',
        single: true,
      });

    const out = await wf.run();

    assert.equal(out.items.length, 20);
    // TODO: verify
  });


});
