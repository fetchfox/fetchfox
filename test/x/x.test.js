import assert from 'assert';
import { Learner } from '../../src/x/index.js';

describe('x', function() {
  this.timeout(5 * 60 * 1000);

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

  it('should learn github repos', async () => {
    const l = new Learner();
    const data = await l.learn({
      url: 'https://www.github.com',
      prompt: 'open source repo details',
    });

    console.log('== data ==');
    console.log(JSON.stringify(data, null, 2));
  });

  it('should learn github commits', async () => {
    const l = new Learner();
    const data = await l.learn({
      url: 'https://www.github.com/',
      prompt: 'find popular repos, and the get their latest commits with metadata'
    });

    console.log('== data ==');
    const ser = JSON.stringify(data, null, 2);
    console.log(ser);

    for (const key of Object.keys(data)) {
      console.log('pattern:', key);
      console.log('examples:\n- ' + data[key].examples.join('\n- '));
      console.log('');
    }

    console.log('Data bytes:', ser.length / 1000, 'kb');
  });
       
  it('should learn the-numbers.com', async () => {
    const l = new Learner();
    const data = await l.learn({
      url: 'https://www.the-numbers.com/',
      prompt: 'movie financial data',
    });

    console.log('== data ==');
    console.log(JSON.stringify(data, null, 2));
  });

});
