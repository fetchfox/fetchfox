import assert from 'assert';
import os from 'os';
import { fox } from '../../src/index.js';

describe('Workflow', function() {
  this.timeout(0);

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
    }

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
      workflow.meta.name.toLowerCase().indexOf('hacker') != -1 ||
      workflow.meta.name.toLowerCase().indexOf('vuln') != -1 ||
      workflow.meta.name.toLowerCase().indexOf('malware') != -1,
      'name sanity check');
    assert.ok(
      workflow.meta.description.toLowerCase().indexOf('hacker') != -1,
      'description sanity check');
  });
});
