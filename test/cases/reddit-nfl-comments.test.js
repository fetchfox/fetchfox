import assert from 'assert';
import process from 'node:process';
import { fox } from '../../src/index.js';

process.on('unhandledRejection', async (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  process.exit(1);
});

describe('old.reddit.com nfl comments', function() {
  this.timeout(5 * 60 * 1000);

  it('should scrape 5 comments', async () => {

    const url = 'https://ffcloud.s3.us-west-2.amazonaws.com/testdata/old-reddit-nfl-comment-page.html';
    const out = await fox
      .init(url)
      .extract({
        username: 'user who posted comment',
        points: 'number of points for the comment',
        content: 'comment content',
      })
      .limit(5)
      .run();

    console.log(out.items);

    const expected = [
      {
        username: 'NFL_Warning',
        points: '0',
        content: "Locked because it's just political fights. NFL would investigate if he had worn a new balance hat, bc it's not officially endorsed by the NFL.",
        url: 'https://ffcloud.s3.us-west-2.amazonaws.com/testdata/old-reddit-nfl-comment-page.html'
      },
      {
        username: 'zombiebillnye',
        points: '8481',
        content: `"We'll figure it out after next week"`,
        url: 'https://ffcloud.s3.us-west-2.amazonaws.com/testdata/old-reddit-nfl-comment-page.html'
      },
      {
        username: 'socom52',
        points: '2903',
        content: '"We will wait to see who wins"',
        url: 'https://ffcloud.s3.us-west-2.amazonaws.com/testdata/old-reddit-nfl-comment-page.html'
      },
      {
        username: 'Expendable_Red_Shirt',
        points: '691',
        content: "You think we'll have a winner after next week?",
        url: 'https://ffcloud.s3.us-west-2.amazonaws.com/testdata/old-reddit-nfl-comment-page.html'
      },
      {
        username: 'PeopleReady',
        points: '545',
        content: 'A winner yes, a concession no',
        url: 'https://ffcloud.s3.us-west-2.amazonaws.com/testdata/old-reddit-nfl-comment-page.html'
      }
    ];

    for (let i = 0; i < expected; i++) {
      // TODO: verify points also, once that is working
      for (const key in ['username', 'content']) {
        assert.equal(
          expected[i][key],
          out.items[i][key],
          `${key} for index ${i}`
        );
      }
    }
  });

  it('should scrape 5 comments with code gen', async () => {
    const url = 'https://ffcloud.s3.us-west-2.amazonaws.com/testdata/old-reddit-nfl-comment-page.html';
    const out = await fox
      .config({ extractor: 'code-gen' })
      .init(url)
      .extract({
        username: 'user who posted comment',
        points: 'number of points for the comment',
        content: 'comment content',
      })
      .limit(5)
      .run();

    console.log(out.items);
  });
});
