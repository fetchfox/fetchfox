import assert from 'assert';
import os from 'os';
import { fox } from '../../src/index.js';
import { redditSampleHtml } from './data.js';

describe('Workflow', function() {
  this.timeout(60 * 1000);

  it('should load steps from json @run', async () => {
    const data = {
      "steps": [
        {
          "name": "const",
          "args": {
            "items": [
              {
                "url": "https://thehackernews.com/"
              }
            ]
          }
        },
        {
          "name": "crawl",
          "args": {
            "query": "Find links to articles about malware and other vulnerabilities",
            "limit": "5"
          }
        },
        {
          "name": "extract",
          "args": {
            "questions": {
              summary: "Summarize the malware/vulnerability in 5-20 words",
              technical: "What are the technical identifiers like filenames, indicators of compromise, etc.?",
              url: "What is the URL? Format: Absolute URL"
            }
          }
        },
        {
          "name": "limit",
          "args": {
            "limit": "2"
          }
        },
        {
          "name": "exportURLs",
          "args": {
            "field": "url",
            "format": "pdf",
            "destination": "google",
            "filename": "a-{url}.pdf",
            "directory": "1_pLorzwxFLXZrQA8DNHPDcqCX5p3szvb"
          }
        }
      ],
    };

    const f = await fox.load(data);

    assert.equal(
      JSON.stringify(f.dump().steps, null, 2),
      JSON.stringify(data.steps, null, 2));
  });

  it('should publish all steps @run', async () => {
    const f = await fox
      .config({ diskCache: os.tmpdir() + '/fetchfox-test-cache' })
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        name: 'What is the name of the pokemon?',
        number: 'What is the pokedex number?',
      })
      .limit(3);

    let count = 0;

    await f.run(null, () => {
      count++
    });

    assert.equal(count, 3);

    const f2 = await fox
      .config({
        diskCache: os.tmpdir() + '/fetchfox-test-cache',
        publishAllSteps: true,
      })
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        name: 'What is the name of the pokemon?',
        number: 'What is the pokedex number?',
      })
      .limit(3);

    let count2 = 0;

    await f2.run(null, () => {
      count2++
    });

    // TODO: There is a race condition where the the last couple partials
    // may not be reported. Fix this and update this test.
    assert.ok(count >= 11 && count <= 13, 'all partials received');
  });

  it('should describe @run', async () => {
    const data = {
      "steps": [
        {
          "name": "const",
          "args": {
            "items": [
              {
                "url": "https://thehackernews.com/"
              }
            ]
          }
        },
        {
          "name": "crawl",
          "args": {
            "query": "Find links to articles about malware and other vulnerabilities",
            "limit": "5"
          }
        },
        {
          "name": "extract",
          "args": {
            "questions": {
              summary: "Summarize the malware/vulnerability in 5-20 words",
              technical: "What are the technical identifiers like filenames, indicators of compromise, etc.?",
              url: "What is the URL? Format: Absolute URL"
            }
          }
        },
        {
          "name": "limit",
          "args": {
            "limit": "2"
          }
        },
        {
          "name": "exportURLs",
          "args": {
            "field": "url",
            "format": "pdf",
            "destination": "google",
            "filename": "a-{url}.pdf",
            "directory": "1_pLorzwxFLXZrQA8DNHPDcqCX5p3szvb"
          }
        }
      ],
    };

    const wf = await fox.load(data).plan();
    await wf.describe();

    assert.ok(
      wf.name.toLowerCase().indexOf('hacker') != -1 ||
      wf.name.toLowerCase().indexOf('vuln') != -1 ||
      wf.name.toLowerCase().indexOf('malware') != -1,
      'name sanity check');
    assert.ok(
      wf.description.toLowerCase().indexOf('hacker') != -1,
      'description sanity check');
  });

  it('should limit number of fetch requests @run', async function() {
    const f = await fox
      .init('https://pokemondb.net/pokedex/national')
      .crawl({
        query: 'Find links to specific Pokemon characters',
      })
      .extract({
        name: 'What is the name of the pokemon?',
        number: 'What is the pokedex number?',
        stats: 'What are the basic stats of this pokemon?',
        single: true,
      })
      .limit(5);

    const out = await f.run();

    assert.equal(out.items.length, 5);

    const max = 5 + f.steps[2].q.concurrency;

    assert.ok(f.ctx.fetcher.usage.completed <= max, 'under max completed');
    assert.ok(f.ctx.fetcher.usage.requests > 10, 'at least 10 requests made');
    assert.ok(f.ctx.crawler.usage.count > 10, 'at least 10 links found');
  });

  it('should plan with html @run', async () => {
    const wf = await fox.plan({
      url: 'https://www.reddit.com/r/nfl/',
      prompt: 'scrape articles',
      html: redditSampleHtml,
    });
    await wf.describe();

    assert.ok(
      wf.name.toLowerCase().indexOf('nfl') != -1,
      'name should contain nfl');
    assert.ok(
      wf.description.toLowerCase().indexOf('nfl') != -1,
      'description should contain nfl');
  });

  it('should use global limit @run', async function() {
    const data = {
      "options": {
        "limit": 2,
      },
      "steps": [
        {
          "name": "const",
          "args": {
            "items": [
              {
                "url": "https://thehackernews.com/"
              }
            ]
          }
        },
        {
          "name": "crawl",
          "args": {
            "query": "Find links to articles about malware and other vulnerabilities",
          }
        },
        {
          "name": "extract",
          "args": {
            "questions": {
              summary: "Summarize the malware/vulnerability in 5-20 words",
              technical: "What are the technical identifiers like filenames, indicators of compromise, etc.?",
              url: "What is the URL? Format: Absolute URL"
            }
          }
        }
      ],
    };

    const f = await fox.load(data);
    let count = 0;
    const out = await f.run(null, (partial) => {
      count++;

      if (count > 2) {
        assert.ok(false, 'over limit in partials callback');
      }
    });

    assert.equal(out.items.length, 2);
    assert.equal(count, 2);
  });
});
