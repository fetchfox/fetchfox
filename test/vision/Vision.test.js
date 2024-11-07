import assert from 'assert';
import os from 'os';
import { Context } from '../../src/context/Context.js';
import { Vision } from '../../src/vision/Vision.js';

describe('Vision', function() {
  this.timeout(30 * 1000);

  it('should answer a prompt', async () => {
    const vision = new Vision();

    const answer = await vision.ask(
      './test/vision/data/pointsyeah-loading.png',
      `what website is this image from? respond in json: {website: "...name of website..."}`,
      { format: 'json' });

    assert.equal(answer.partial.website.toLowerCase(), 'pointsyeah');

  });

});
