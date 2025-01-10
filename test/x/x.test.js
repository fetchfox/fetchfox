import assert from 'assert';

import { learn } from '../../src/x/index.js';

describe('x', function() {
  this.timeout(60 * 1000);

  it('should learn', async () => {
    const knowledge = await learn({
      url: 'https://pokemondb.net',
      prompt: 'scrape pokemon details/stats',
    });

    console.log(JSON.stringify(knowledge, null, 2));

    for (const pattern of Object.keys(knowledge)) {
      console.log(pattern);
      for (const item of knowledge[pattern].items) {
        console.log(`- ${item.item} (${Object.keys(item.schema).join(', ')})`);
      }
      console.log('');
    }
  });

});
