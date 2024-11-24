import { fox } from '../../src/index.js';
import { runMatrix, createMatrix } from '../lib/index.js';
import { checkExcludeUrls } from '../lib/checks.js';
import { storeScores } from '../lib/store.js';

describe('google.com search', function() {
  this.timeout(3 * 60 * 1000); // 3 minutes

  it('should bench google search result crawl @bench', async () => {
    const json = {
      "steps": [
        {
          "name": "const",
          "args": {
            "items": [
              {
                "url": "{{url}}"
              }
            ]
          }
        },
        {
          "name": "extract",
          "args": {
            "questions": {
              "url": "{{prompt}}"
            }
          }
        },
      ],
      "options": {
        "limit": 20
      }
    };

    const scores = await runMatrix(
      'exclude google.com from search results',
      json,
      createMatrix({
        ai: [
          'openai:gpt-4o',
          'openai:gpt-4o-mini',
          'google:gemini-1.5-flash',
          'google:gemini-1.5-pro',
        ],
        fetcher: [
          'fetch',
          'playwright',
        ],
        url: [
          'https://www.google.com/search?q=advertising+agencies+in+Alabama%2C+that+feature+political+advertising',
          'https://ffcloud.s3.amazonaws.com/fetchfox-docs/2yxgmko5yy/https-www-google-com-search-q-advertising-agencies-in-Alabama-2C-that-feature-political-advertising.html',
        ],
        prompt: [
          'Results',
          'Search result pages',
          'Search results pages url',
          'Urls of off-site search results, NOT on google.com',
        ],
      }),
      [
        (items) => checkExcludeUrls(items, 'google.com'),
      ],
      { shouldSave: true });

    console.log(JSON.stringify(scores, null, 2));
    await storeScores(scores);

  });

  it('should bench google search pagination result crawl @bench', async () => {
    const json = {
      "steps": [
        {
          "name": "const",
          "args": {
            "items": [
              {
                "url": "https://www.google.com/search?q=advertising+agencies+in+Alabama%2C+that+feature+political+advertising"
              }
            ]
          }
        },
        {
          "name": "fetch",
          "args": {
            "urlFields": [
              "url"
            ]
          }
        },
        {
          "name": "crawl",
          "args": {
            "query": "find pagination links, eg. 1, 2, 3, 4..."
          }
        },
        {
          "name": "extract",
          "args": {
            "questions": {
              "url": "Search results pages url (Full absolute URL)"
            }
          }
        }
      ],
      "options": {
        "limit": 20
      }
    };

    const scores = await runMatrix(
      'exclude google.com pagination',
      json,
      createMatrix({
        ai: [
          'openai:gpt-4o',
          'openai:gpt-4o-mini',
          'google:gemini-1.5-flash',
          'google:gemini-1.5-pro',
        ],
        fetcher: [
          'fetch',
          'playwright',
        ],
        url: [
          'https://www.google.com/search?q=advertising+agencies+in+Alabama%2C+that+feature+political+advertising',
        ],
        prompt: [
          'Results',
          'Search result pages',
          'Search results pages url',
          'Urls of off-site search results, NOT on google.com',
        ],
      }),
      [
        (items) => checkExcludeUrls(items, 'google.com'),
      ],
      { shouldSave: true });

    console.log(JSON.stringify(scores, null, 2));
    await storeScores(scores);

  });

});
