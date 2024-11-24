import os from 'os';
import fs from 'fs';
import assert from 'assert';
import process from 'node:process';
import { fox } from '../../src/index.js';

describe('news.ycombinator.com', function() {
  this.timeout(5 * 60 * 1000);

  it('should work @run', async () => {
    let countPartials = 0;
    const out = await fox
      .init('https://news.ycombinator.com')
      .extract({
        articleTitle: 'What is the title of the article?',
        numComments: 'What is the number of comments?',
      })
      .run(null, (partial) => {
        countPartials++;
      });

    // Sanity checks
    assert.ok(countPartials > 15 && countPartials < 35);
    assert.ok(out.items.length > 15 && out.items.length < 35);
    const totalComments = out.items
      .filter(item => {
        try {
          return !isNaN(parseInt(item.numComments));
        } catch(e) {
          return false;
        }
      })
      .reduce((acc, item) => acc + parseInt(item.numComments), 0);
    assert.ok(totalComments > 100 && totalComments < 10000);
  });

  it('should crawl @run', async () => {
    let countPartials = 0;
    const out = await fox
      .init('https://news.ycombinator.com')
      .crawl('find links to comment pages, format: https://news.ycombinator.com/item?id=...')
      .extract({
        topCommenter: 'What is the username of the top commenter?',
        single: true,
      })
      .run(null, (partial) => {
        countPartials++;
      });

    assert.ok(countPartials > 10 && countPartials < 35);
    assert.ok(out.items.length > 10 && out.items.length < 35);
  });
});
