import { Learner } from '../../src/learn/Learner.js';
import { KnowledgeBase } from '../../src/learn/KnowledgeBase.js';
import { testCache, setTestTimeout } from '../lib/util.js';

describe('Learner', function() {

  this.timeout(60 * 1000);

  it('should learn pokemon', async () => {
    const url = 'https://pokemondb.net';
    const prompt = 'scrape pokemon details/stats';

    const cache = testCache();
    const kb = new KnowledgeBase();
    const l = new Learner(kb, { cache });

    await l.learn(
      { url, prompt },
      () => {
        console.log('== Data so far ==');
        console.log(JSON.stringify(kb, null, 2));
        console.log('');
      });

  });

});

