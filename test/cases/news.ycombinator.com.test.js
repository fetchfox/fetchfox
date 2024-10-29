import os from 'os';
import fs from 'fs';
import assert from 'assert';
import process from 'node:process';
import { fox } from '../../src/index.js';

process.on('unhandledRejection', async (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  process.exit(1);
});

describe('news.ycombinator.com', function() {
  this.timeout(5 * 60 * 1000);

  it('should work', async () => {
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
});
