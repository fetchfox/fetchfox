import assert from 'assert';
import os from 'os';
import { fox } from '../../src/index.js';
import { redditSampleHtml } from './data.js';

describe('Workflow', function() {
  this.timeout(60 * 1000);

  it('should load from json @run', async () => {
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
      JSON.stringify(f.dump()),
      JSON.stringify(data));
  });

  it('should be able to publish all steps @run', async () => {
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

    assert.equal(count2, 12);
  });

  it('should analyze @run', async () => {
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

    const workflow = await fox.load(data).plan();

    assert.ok(
      workflow.name.toLowerCase().indexOf('hacker') != -1 ||
      workflow.name.toLowerCase().indexOf('vuln') != -1 ||
      workflow.name.toLowerCase().indexOf('malware') != -1,
      'name sanity check');
    assert.ok(
      workflow.description.toLowerCase().indexOf('hacker') != -1,
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
    assert.ok(f.ctx.fetcher.usage.requests <= max);
    assert.ok(f.ctx.crawler.usage.count > 30);
  });

  it('should plan with html @run', async () => {
    const workflow = await fox.plan({
      url: 'https://www.reddit.com/r/nfl/',
      prompt: 'scrape articles',
      html: redditSampleHtml,
    });

    assert.ok(
      workflow.name.toLowerCase().indexOf('nfl') != -1,
      'name should contain nfl');
    assert.ok(
      workflow.description.toLowerCase().indexOf('nfl') != -1,
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
