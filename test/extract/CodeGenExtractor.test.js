import assert from 'assert';
import os from 'os';
import { fox } from '../../src/index.js';
import { getFetcher, CodeGenExtractor } from '../../src/index.js';
import { testCache } from '../lib/util.js';

describe('CodeGenExtractor', function() {
  this.timeout(3 * 60 * 1000);

  it('should learn oyl @run', async () => {
    const urls = ['https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/irpyrvx78l/https-ownyourlabs-com-shop-oyl-.html'];

    const questions = {
      product_name: 'What is the name of this product?',
      price: 'What is the price of this product? Format: $XX.XX'
    };
    const cge = new CodeGenExtractor();
    await cge.learn(urls, { questions });

    const out = await cge.all(urls[0], questions);
    assert.equal(out.length, 161);
  });

  it('should run workflow with code gen oyl @run', async () => {
    const url = 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/irpyrvx78l/https-ownyourlabs-com-shop-oyl-.html';
    const wf = await fox
      .config({
        cache: testCache(),
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
        cache: testCache(),
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
