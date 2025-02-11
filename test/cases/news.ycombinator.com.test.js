import os from 'os';
import fs from 'fs';
import { logger } from '../../src/log/logger.js';
import assert from 'assert';
import process from 'node:process';
import { fox } from '../../src/index.js';
import { testCache } from '../lib/util.js';

describe('news.ycombinator.com', function() {

  before(() => {
    logger.testMode();
  });

  it('should work @run @fast', async () => {
    let countPartials = 0;
    const wf = await fox
      .config({ cache: testCache() })
      .init('https://news.ycombinator.com')
      .extract({
        articleTitle: 'What is the title of the article?',
        numComments: 'What is the number of comments?',
      });

    const out = await wf
      .run(null, (partial) => {
        countPartials++;
      });

    // Sanity checks
    assert.ok(countPartials > 15 && countPartials < 35, 'partials ballpark');
    assert.ok(out.items.length > 15 && out.items.length < 35, 'items ballpark');
    const totalComments = out.items
      .filter(item => {
        try {
          return !isNaN(parseInt(item.numComments));
        } catch(e) {
          return false;
        }
      })
      .reduce((acc, item) => acc + parseInt(item.numComments), 0);
    assert.ok(totalComments > 100 && totalComments < 10000, 'comments ballpark');

    wf.abort();
  });

  it('should crawl @run @fast', async () => {
    let countPartials = 0;
    const wf = await fox
      .config({ cache: testCache() })
      .init('https://news.ycombinator.com')
      .crawl({
        query: 'find links to comment pages, format: https://news.ycombinator.com/item?id=...',
        limit: 5,
      })
      .extract({
        topCommenter: 'What is the username of the top commenter?',
        single: true,
      });

    const out = await wf
      .run(null, (partial) => {
        countPartials++;
      });

    assert.ok(countPartials > 1 && countPartials < 10);
    assert.ok(out.items.length > 1 && out.items.length < 10);

    wf.abort();
  });
});
