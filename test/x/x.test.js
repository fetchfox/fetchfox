import assert from 'assert';

import { KnowledgeBase, Learner } from '../../src/x/index.js';

describe('x', function() {
  this.timeout(60 * 1000);

  it('should learn pokemon', async () => {
    const l = new Learner();
    const data = await l.learn({
      url: 'https://pokemondb.net',
      prompt: 'scrape pokemon details/stats',
    });
  });

  it('should learn hacker news', async () => {
    const l = new Learner();
    const data = await l.learn({
      url: 'https://news.ycombinator.com/news',
      prompt: 'user comments',
    });
  });

});
