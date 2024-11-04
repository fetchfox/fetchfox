import assert from 'assert';
import os from 'os';
import { Planner } from '../../src/plan/Planner.js';
import { redditNflCommentPageHtml } from './data.js';

process.on('unhandledRejection', async (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  process.exit(1);
});

describe('Planer', function() {
  this.timeout(30 * 1000);

  it('should do single page scrape for reddit comments @run', async () => {

    console.log('redditNflCommentPageHtml', redditNflCommentPageHtml);

    const planner = new Planner();

    const steps = await planner.plan({
      prompt: 'scrape comments',
      url: 'https://old.reddit.com/r/nfl/comments/1gi5ad5/nfl_reviewing_potential_fine_of_49ers_nick_bosa/',
      html: redditNflCommentPageHtml,
    });

    assert.equal(steps.length, 2);
    assert.equal(steps[0].name(), 'const');
    assert.equal(steps[1].name(), 'extract');
    assert.equal(steps[1].single, false);
  });
});
