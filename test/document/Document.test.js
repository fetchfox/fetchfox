import assert from 'assert';
import { getFetcher, getAI, getExtractor } from '../../src/index.js';
import { Document } from '../../src/document/Document.js';
import { testCache, setTestTimeout } from '../lib/util.js';

describe('Document', function() {

  setTestTimeout(this);

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
      console.log('got doc:' + doc);
      await doc.learn(ai, template);
    }

  });

});
