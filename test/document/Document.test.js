import assert from 'assert';
import { getFetcher, getAI, getExtractor } from '../../src/index.js';
import { Document } from '../../src/document/Document.js';
import { testCache, setTestTimeout } from '../lib/util.js';

describe('Document', function() {

  setTestTimeout(this, 30 * 1000);

  it('should learn', async () => {
    const f = getFetcher('playwright', { headless: true, cache: testCache() });
    const ai = getAI('openai:gpt-4o', { cache: testCache() });

    const url = 'https://pokemondb.net/pokedex/national'
    const template = {
      "generation": "Generation number of this pokemon",
      "name": "Name of the pokemon",
      "type": "Type of the pokemon",
      "url": "URL of the pokemon"
    }

    for await (const doc of f.fetch(url)) {
      await doc.learn(ai, template);
    }
  });

  it('should find ul li a @fast', async () => {
    // const url = 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/jw5t8249rs/https-www-cos-com-en-usd-women-new-arrivals-html'
    const url = 'https://www.cos.com/en_usd/women/new-arrivals.html';

    const f = getFetcher('playwright', {
      cdp: process.env.CDP_URL,
      headless: true,
      cache: testCache(),
    });
    const doc = await f.first(url);
    console.log('doc.html', doc.html);

    for (const link of doc.links) {
      console.log('link', link.url);
    }

  });

});
