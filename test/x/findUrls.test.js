import assert from 'assert';

import { findUrls } from '../../src/x/index.js';

describe('findUrls', function() {
  this.timeout(60 * 1000);

  it('should find urls', async () => {
    await findUrls({
      url: 'https://pokemondb.net/pokedex/national',
    });
  });

});
