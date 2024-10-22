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
    const f = await fox
      .config({
        fetcher: ['playwright', { headless: true }],
        diskCache: os.tmpdir() + '/fetchfox-text-cache',
      });

    let countPartials = 0;

    const out = await f
      .init('https://news.ycombinator.com')
      .crawl('find links to comment pages for each article. URL must have item?id= in it')
      .extract({
        questions: {
          articleTitle: 'What is the title of the article?',
          numComments: 'What is the number of comments?',
          submitAuthor: 'Who submitted this article?',
          topAuthor: 'What is the username of the top commenter?',
          topCommentFirstWords: 'What are the first 5 words of the top comment?',
        },
        single: true,
      })
      .run(null, (partial) => {
        const { item, results } = partial;
        console.log(item);
        countPartials++;
      });

    // Sanity checks
    assert.ok(countPartials > 15 && countPartials < 35);
    assert.ok(out.length > 15 && out.length < 35);
    const totalComments = out
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
