import assert from 'assert';
import { Learner, Planner, Runner } from '../../src/x/index.js';

describe('x', function() {
  this.timeout(5 * 60 * 1000);

  const printKnowledgeBase = (kb) => {
    console.log('== kb ==');
    const ser = JSON.stringify(kb, null, 2);
    console.log(ser);

    for (const key of Object.keys(kb)) {
      console.log('pattern:', key);
      console.log('examples:\n- ' + kb[key].examples.join('\n- '));
      console.log('');
    }
    console.log('Knowledge base bytes:', ser.length / 1000, 'kb');
  }

  const run = async (url, prompt) => {
    const l = new Learner();
    const kb = await l.learn({ url, prompt });

    printKnowledgeBase(kb);

    const r = new Runner();
    await r.run({ url, prompt, kb });

    // const p = new Planner();
    // const plan = await p.plan({ url, prompt, kb });
    // console.log('plan:');
    // console.log(JSON.stringify(plan));
  }

  it('should learn pokemon', async () => {
    await run(
      'https://pokemondb.net',
      'scrape pokemon details/stats',
    );
  });

  it('should learn hacker news', async () => {
    await run(
      'https://news.ycombinator.com/news',
      'user comments',
    );
  });

  it('should learn github repos', async () => {
    await run(
      'https://www.github.com',
      'open source repo details',
    );
  });

  it('should learn github commits', async () => {
    await run (
      'https://www.github.com/',
      'find popular repos, and the get their latest commits with metadata',
    );
  });
       
  it('should learn the-numbers.com', async () => {
    await run(
      'https://www.the-numbers.com/',
      'movie financial data',
    );
  });

});
