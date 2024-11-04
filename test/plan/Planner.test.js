import { logger } from '../../src/log/logger.js';
import assert from 'assert';
import os from 'os';
import { Planner } from '../../src/plan/Planner.js';
import {
  redditNflCommentPageHtml,
  redditNflMainPageHtml,
  pokedexPageHtml,
} from './data.js';

process.on('unhandledRejection', async (reason, p) => {
  console.log('Unhandled Rejection at:', p, 'reason:', reason);
  process.exit(1);
});

const logSteps = (steps) => {
  logger.debug(JSON.stringify(steps.map(s => s.dump()), null, 2));
}

describe('Planner', function() {
  this.timeout(30 * 1000);

  it('should do single page scrape for reddit comments @run', async () => {
    const planner = new Planner();

    const steps = await planner.plan({
      prompt: 'scrape comments',
      url: 'https://old.reddit.com/r/nfl/comments/1gi5ad5/nfl_reviewing_potential_fine_of_49ers_nick_bosa/',
      html: redditNflCommentPageHtml,
    });

    logSteps(steps);

    assert.equal(steps.length, 2);
    assert.equal(steps[0].name(), 'const');
    assert.equal(steps[1].name(), 'extract');
    assert.equal(steps[1].single, false);
  });

  it('should do single page scrape for reddit article titles @run', async () => {
    const planner = new Planner();

    const steps = await planner.plan({
      prompt: 'scrape article titles, points, and submitter username',
      url: 'https://old.reddit.com/r/nfl/',
      html: redditNflMainPageHtml,
    });

    logSteps(steps);

    assert.equal(steps.length, 2);
    assert.equal(steps[0].name(), 'const');
    assert.equal(steps[1].name(), 'extract');
    assert.equal(steps[1].single, false);

    const d = JSON.stringify(steps[1].dump()).toLowerCase();
    assert.ok(d.indexOf('title') != -1);
    assert.ok(d.indexOf('point') != -1);
    assert.ok(
      d.indexOf('username') != -1 ||
      d.indexOf('submit') != -1
    );
  });


  it('should do multi page crawl scrape for reddit article summaries @run', async () => {
    const planner = new Planner();

    const steps = await planner.plan({
      prompt: 'scrape article titles and summarize contents in 10 words',
      url: 'https://old.reddit.com/r/nfl/',
      html: redditNflMainPageHtml,
    });

    logSteps(steps);

    // TODO: ai prompt engineering so it returns exactly 3 steps
    assert.ok(
      steps.length >= 3 &&
      steps.length <= 4);
    assert.equal(steps[0].name(), 'const');
    assert.equal(steps[1].name(), 'crawl');
    assert.equal(steps[2].name(), 'extract');
    assert.equal(steps[2].single, true);

    const d = JSON.stringify(steps[2].dump()).toLowerCase();
    assert.ok(d.indexOf('title') != -1, 'check for title question');
    assert.ok(d.indexOf('summary') != -1, 'check for summary question');
  });

  // TODO: The AI is not smart enough to correctly plan this scrape right now. Return to this later. Maybe prompt engineering will help.
  it('should do multi page crawl scrape for reddit comments @disabled', async () => {
    const planner = new Planner();

    const steps = await planner.plan({
      prompt: 'scrape all comment usernames, contents, and scores',
      url: 'https://old.reddit.com/r/nfl/',
      html: redditNflMainPageHtml,
    });

    logSteps(steps);

    assert.ok(steps.length == 3);
    assert.equal(steps[0].name(), 'const');
    assert.equal(steps[1].name(), 'crawl');
    assert.equal(steps[2].name(), 'extract');
    assert.equal(steps[2].single, false);
  });

  it('should do single page crawl for pokedex data @run', async () => {
    const planner = new Planner();

    const steps = await planner.plan({
      prompt: 'scrape pokemon data',
      url: 'https://pokemondb.net/pokedex/national',
      html: pokedexPageHtml,
    });

    logSteps(steps);

    assert.equal(steps.length, 2);
    assert.equal(steps[0].name(), 'const');
    assert.equal(steps[1].name(), 'extract');
    assert.equal(steps[1].single, false);
  });


  it('should do multi page crawl for pokedex data @run', async () => {
    const planner = new Planner();

    const steps = await planner.plan({
      prompt: 'scrape pokemon data: name, number, HP, damage, defense',
      url: 'https://pokemondb.net/pokedex/national',
      html: pokedexPageHtml,
    });

    logSteps(steps);

    assert.equal(steps.length, 3);
    assert.equal(steps[0].name(), 'const');
    assert.equal(steps[1].name(), 'crawl');
    assert.equal(steps[2].name(), 'extract');
    assert.equal(steps[2].single, true);

    const d = JSON.stringify(steps[2].dump()).toLowerCase();
    assert.ok(d.indexOf('hp') != -1, 'check for hp question');
    assert.ok(d.indexOf('damage') != -1, 'check for damage question');
    assert.ok(d.indexOf('defense') != -1, 'check for defense question');
  });
});
