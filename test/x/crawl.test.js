import assert from 'assert';

import { crawl } from '../../src/x/index.js';

describe('crawl', function() {

  it('should crawl', async () => {
    await crawl();
  });

});
