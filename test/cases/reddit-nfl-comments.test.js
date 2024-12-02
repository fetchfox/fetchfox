import { logger } from '../../src/log/logger.js';
import assert from 'assert';
import process from 'node:process';
import { fox } from '../../src/index.js';

describe('old.reddit.com nfl comments', function() {
  this.timeout(5 * 60 * 1000);

  it('should scrape 5 comments @run', async () => {
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

  it('should scrape 100 comments with code gen @disabled', async () => {
    const url = 'https://ffcloud.s3.us-west-2.amazonaws.com/testdata/old-reddit-nfl-comment-page.html';

    let count = 0;

    const out = await fox
      .config({
        extractor: ['code-gen', { ai: 'openai:gpt-4o' }],
      })
      .init(url)
      .extract({
        questions: {
          username: 'user who posted comment, exclude mod posts',
          points: 'number of points for the comment',
          content: 'comment content',
        },
        examples: [url],
      })
      .limit(100)
      .run(
        null,
        (partial) => {
          count++;
        });

    assert.equal(count, 100);

    const first = out.items.slice(0, 4);
    const expected = [
      {
        username: 'zombiebillnye',
        points: '8482',
        content: `"We'll figure it out after next week"`
      },
      {
        username: 'socom52',
        points: '2904',
        content: '"We will wait to see who wins"'
      },
      {
        username: 'Expendable_Red_Shirt',
        points: '692',
        content: "You think we'll have a winner after next week?"
      },
      {
        username: 'PeopleReady',
        points: '546',
        content: 'A winner yes, a concession no'
      }
    ];

    for (let i = 0; i < expected.length; i++) {
      const a = out.items[i];
      const e = expected[i];

      logger.debug(`Actual:   ${JSON.stringify(a, null, 2)}`);
      logger.debug(`Expected: ${JSON.stringify(e, null, 2)}`);

      assert.equal(a.username, e.username);
      assert.equal(a.content.trim(), e.content.trim());

      // Reddit has 3 different scores in HTML:
      //
      //   <span class="score dislikes" title="8480">8480 points</span>
      //   <span class="score unvoted" title="8481">8481 points</span>
      //   <span class="score likes" title="8482">8482 points</span>
      //
      // For this test, as long as we get one of them, its ok.

      const diff = Math.abs(parseInt(a.points - e.points));
      assert.ok(diff <= 2);
    }
  });

});
