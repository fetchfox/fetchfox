import assert from 'assert';
import { Fetcher, fox, OpenAI } from '../../src/index.js';
import { testCache } from '../lib/util.js';

describe('Workflow', function () {
  this.timeout(30 * 1000);

  it('should run the deep crawler correctly @run @fast', async () => {
    const wf = fox
      .config({ cache: testCache() })
      .init('https://pokemondb.net/pokedex/national')
      .deepcrawl('scrape pokemon with name, weight, and a list of traits')
      .limit(4);

    const results = await wf.run();
    const urls = results.items.map((it) => it._url);

    const expected = [
      'https://pokemondb.net/pokedex/bulbasaur',
      'https://pokemondb.net/pokedex/ivysaur',
      'https://pokemondb.net/pokedex/venusaur',
      'https://pokemondb.net/pokedex/charmander',
    ];

    assert.equal(JSON.stringify(urls), JSON.stringify(expected));
  });

  it('should deep crawl from wrong page @run @fast', async () => {
    const wf = fox
      .config({ cache: testCache() })
      .init('https://pokemondb.net/pokedex/national')
      .deepcrawl('find pokemon game locations and their names and what generations are supported')
      .limit(4);

    const results = await wf.run();
    const urls = results.items.map((it) => it._url);

    const expected = [
      'https://pokemondb.net/location/kanto-route-1',
      'https://pokemondb.net/location/kanto-route-2',
      'https://pokemondb.net/location/kanto-route-3',
      'https://pokemondb.net/location/kanto-route-4',
    ];

    assert.equal(JSON.stringify(urls), JSON.stringify(expected));
  });

  it('should load steps from json @run @fast', async () => {
    const data = {
      steps: [
        {
          name: 'const',
          args: {
            items: [
              {
                url: 'https://thehackernews.com/',
              },
            ],
            maxPages: '10',
          },
        },
        {
          name: 'crawl',
          args: {
            query: 'Find links to articles about malware and other vulnerabilities',
            limit: '5',
            maxPages: '10',
          },
        },
        {
          name: 'extract',
          args: {
            questions: {
              summary: 'Summarize the malware/vulnerability in 5-20 words',
              technical: 'What are the technical identifiers like filenames, indicators of compromise, etc.?',
              url: 'What is the URL? Format: Absolute URL',
            },
            maxPages: '10',
          },
        },
        {
          name: 'limit',
          args: {
            limit: '2',
          },
        },
      ],
    };

    const f = await fox.config({ cache: testCache() }).load(data);

    assert.equal(JSON.stringify(f.dump().steps, null, 2), JSON.stringify(data.steps, null, 2));
  });

  it('should publish all steps @run @fast', async () => {
    const f = await fox
      .config({ cache: testCache() })
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        name: 'What is the name of the pokemon?',
        number: 'What is the pokedex number?',
      })
      .limit(3);

    let count = 0;
    let countLoading = 0;

    await f.run(null, (partial) => {
      count++;
      if (partial.item?._meta?.status == 'loading') {
        countLoading2++;
      }
    });

    assert.equal(count, 3);
    assert.equal(countLoading, 0, 'loading by default should not publish');

    const f2 = await fox
      .config({
        cache: testCache(),
        publishAllSteps: true,
      })
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        name: 'What is the name of the pokemon?',
        number: 'What is the pokedex number?',
      })
      .limit(3);

    let count2 = 0;
    let countLoading2 = 0;

    await f2.run(null, (partial) => {
      count2++;
      if (partial.item?._meta?.status == 'loading') {
        countLoading2++;
      }
    });

    assert.equal(count2, 16, 'all partials received');
    assert.ok(countLoading2 >= 3, 'all loading received');

    f2.abort();
  });

  it('should describe @run @fast', async () => {
    const data = {
      steps: [
        {
          name: 'const',
          args: {
            items: [
              {
                url: 'https://thehackernews.com/',
              },
            ],
          },
        },
        {
          name: 'crawl',
          args: {
            query: 'Find links to articles about malware and other vulnerabilities',
            limit: '5',
          },
        },
        {
          name: 'extract',
          args: {
            questions: {
              summary: 'Summarize the malware/vulnerability in 5-20 words',
              technical: 'What are the technical identifiers like filenames, indicators of compromise, etc.?',
              url: 'What is the URL? Format: Absolute URL',
            },
          },
        },
        {
          name: 'limit',
          args: {
            limit: '2',
          },
        },
      ],
    };

    const wf = await fox.config({ cache: testCache() }).load(data).plan();
    await wf.describe();

    assert.ok(
      wf.name.toLowerCase().indexOf('hacker') != -1 ||
        wf.name.toLowerCase().indexOf('vuln') != -1 ||
        wf.name.toLowerCase().indexOf('malware') != -1,
      'name sanity check',
    );
    assert.ok(wf.description.toLowerCase().indexOf('hacker') != -1, 'description sanity check');
  });

  it('should use global limit @run @fast', async function () {
    const data = {
      options: {
        limit: 2,
      },
      steps: [
        {
          name: 'const',
          args: {
            items: [
              {
                url: 'https://thehackernews.com/',
              },
            ],
          },
        },
        {
          name: 'crawl',
          args: {
            query: 'Find links to articles about malware and other vulnerabilities',
          },
        },
        {
          name: 'extract',
          args: {
            questions: {
              summary: 'Summarize the malware/vulnerability in 5-20 words',
              technical: 'What are the technical identifiers like filenames, indicators of compromise, etc.?',
              url: 'What is the URL? Format: Absolute URL',
            },
          },
        },
      ],
    };

    const f = await fox.config({ cache: testCache() }).load(data);
    let count = 0;
    const out = await f.run(null, (partial) => {
      count++;

      if (count > 2) {
        assert.ok(false, 'over limit in partials callback');
      }
    });

    assert.equal(out.items.length, 2);
    assert.equal(count, 2);

    f.abort();
  });

  it('should finish with flakey fetcher @run', async function () {
    this.timeout(45 * 1000);

    let count = 0;
    const FlakeyFetcher = class extends Fetcher {
      async *fetch(...args) {
        for await (const out of super.fetch(...args)) {
          if (++count % 2 == 0) {
            throw new Error('flakey fetch');
          } else {
            yield Promise.resolve(out);
          }
        }
      }
    };

    const f = await fox
      .config({
        cache: testCache(),
        fetcher: new FlakeyFetcher({
          concurrency: 4,
          intervalCap: 4,
          interval: 1000,
        }),
      })
      .init('https://pokemondb.net/pokedex/national')
      .crawl('find links to individual character pokemon pages')
      .extract({
        name: 'What is the name of the pokemon? Start with the first one',
        number: 'What is the pokedex number?',
      })
      .limit(5);

    const out = await f.run();
    assert.equal(out.items.length, 5);
  });

  it('should finish incomplete with flakey AI @run @slow', async function () {
    this.timeout(45 * 1000);

    let count = 0;
    const FlakeyAI = class extends OpenAI {
      async *inner(...args) {
        for await (const out of super.inner(...args)) {
          if (++count % 50 == 0) {
            throw new Error('flakey AI');
          } else {
            yield Promise.resolve(out);
          }
        }
      }
    };

    const f = await fox
      .config({
        cache: testCache(),
        ai: new FlakeyAI(),
      })
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        name: 'What is the name of the pokemon? Start with the first one',
        number: 'What is the pokedex number?',
      })
      .limit(5);

    const out = await f.run();

    // Expect 2 because AI error stops the entire stream
    assert.equal(out.items.length, 2);
  });

  it('should finish crawl with flakey AI @run @slow', async function () {
    this.timeout(45 * 1000);

    let count = 0;
    const FlakeyAI = class extends OpenAI {
      async *inner(...args) {
        for await (const out of super.inner(...args)) {
          if (++count % 50 == 0) {
            throw new Error('flakey AI');
          } else {
            yield Promise.resolve(out);
          }
        }
      }
    };

    const f = await fox
      .config({
        cache: testCache(),
        ai: new FlakeyAI(),
      })
      .init('https://pokemondb.net/pokedex/national')
      .crawl('find links to individual character pokemon pages')
      .extract({
        name: 'What is the name of the pokemon? Start with the first one',
        number: 'What is the pokedex number?',
      })
      .limit(5);

    const out = await f.run();

    // TODO: Make this deterministic, and assert a specific number
    assert.ok(out.items.length >= 1);
  });

  const runAbortCases = async (cases) => {
    for (const [timeout, limit] of cases) {
      const controller = new AbortController();
      const signal = controller.signal;

      const wf = await fox
        .config({ signal, fetcher: 'playwright' })
        .init('https://news.ycombinator.com/news')
        .crawl({ query: 'Find links to articles', maxPages: 5 })
        .extract({ title: 'article title' })
        .limit(100)
        .plan();

      setTimeout(() => controller.abort(), timeout);

      const start = new Date().getTime();
      const out = await wf.run();
      const took = new Date().getTime() - start;

      assert.ok(took < limit, `took=${took} timeout=${timeout} limit=${limit} quickly abort`);
    }
  };

  it('should abort @run @fast', async function () {
    const cases = [
      [1, 100],
      [10, 200],
      [100, 400],
    ];
    await runAbortCases(cases);
  });

  it('should abort @run @slow', async function () {
    const cases = [
      [1, 100],
      [10, 200],
      [100, 400],
      [1000, 1500],
      [2000, 3000],
      [5000, 6500],
      [10000, 12000],
    ];
    await runAbortCases(cases);
  });

  it('should use api key @run @fast', async () => {
    const f = await fox
      .config({
        cache: testCache(),
        ai: ['openai:gpt-4o-mini', { apiKey: 'invalid', maxRetries: 0 }],
      })
      .init('https://pokemondb.net/pokedex/national')
      .extract({
        name: 'What is the name of the pokemon?',
        number: 'What is the pokedex number?',
      })
      .limit(3);

    let err;
    try {
      await wf.run();
    } catch (e) {
      err = e;
    }

    assert.ok(!!err);
  });
});
