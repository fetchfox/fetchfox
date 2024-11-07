import assert from 'assert';
import os from 'os';
import { Context } from '../../src/context/Context.js';
import { Vision } from '../../src/vision/Vision.js';

describe('Vision', function() {
  this.timeout(5 * 60 * 1000);

  it('should answer a prompt @run', async () => {
    const vision = new Vision();
    const answer = await vision.ask(
      './test/vision/data/pointsyeah-loading.png',
      `what website is this image from? respond in json: {website: "...name of website..."}`,
      { format: 'json' });
    assert.equal(answer.partial.website.toLowerCase(), 'pointsyeah');
  });

  it('should check loading', async () => {
    const vision = new Vision();

    const cases = [
      ['pointsyeah-loading.png', { isLoading: true }],
      ['github-done.png', { isLoading: false, readyState: 'fully-ready' }],
      ['github-loading-bar.png', { isLoading: true, readyState: 'partially-ready' }],
      ['pointsyeah-loading.png', { isLoading: true }],
      ['pointsyeah-login-done.png', { isLoading: false, readyState: 'fully-ready' }],
      ['pointsyeah-login-loading.png', { isLoading: true }],
      ['pointsyeah-search-done.png', { isLoading: false, readyState: 'fully-ready' }],
      ['pointsyeah-search-loading-1.png', { isLoading: true, readyState: 'not-ready' }],
      ['pointsyeah-search-loading-2.png', { isLoading: true }],
      ['pointsyeah-search-partial-1.png', { isLoading: true, readyState: 'partially-ready' }],
      ['pointsyeah-search-partial-2.png', { isLoading: true, readyState: 'partially-ready' }],
    ];

    for (const [filename, expected] of cases) {
      const answer = await vision.askIsLoading(
        `./test/vision/data/${filename}`,
        `what website is this image from? respond in json: {website: "...name of website..."}`,
        { format: 'json' });

      for (const key of Object.keys(expected)) {
        assert.equal(answer[key], expected[key], `${filename} ${key}`);
      }
    }
  });

});
