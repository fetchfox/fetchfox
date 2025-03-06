import assert from 'assert';
import { getFetcher, getAI, getExtractor } from '../../src/index.js';
import { Document } from '../../src/document/Document.js';

describe('Document', function() {

  this.timeout(180 * 1000);

  it('should learn', async () => {
    const f = getFetcher('playwright', { headless: false });
    const ai = getAI('openai:gpt-4o');

    // const url = 'https://onereal.com/search-agent?search_by=LOCATION&state_code=US-FL'
    // const template = {
    //   "name": "name of the real estate agent",
    //   "url": "url of the real estate agent"
    // }

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
