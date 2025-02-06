import assert from 'assert';
import http from 'http';
import { logger } from '../../src/log/logger.js';
import { testCache } from '../lib/util.js';
import { getFetcher, getAI, Instructions } from '../../src/index.js';
import * as cheerio from 'cheerio';

describe('Instructions', function() {

  // Actions take a while to execute
  // TODO: caching to bring down test times
  this.timeout(15 * 1000);

  // TODO: re-enable these tests

  const cases = [
    // Objects as the commands
    {
      name: 'should handle next page pagination with objects @disabled',
      commands: [
        { prompt: 'click to go to the next page', max: 3, repeat: 3 },
        { prompt: 'click each profile link', max: 4 },
      ],
      expected: [
        ['Page 1', 'Profile content 1'],
        ['Page 1', 'Profile content 2'],
        ['Page 1', 'Profile content 3'],
        ['Page 1', 'Profile content 4'],

        ['Page 2', 'Profile content 6'],
        ['Page 2', 'Profile content 7'],
        ['Page 2', 'Profile content 8'],
        ['Page 2', 'Profile content 9'],

        ['Page 3', 'Profile content 11'],
        ['Page 3', 'Profile content 12'],
        ['Page 3', 'Profile content 13'],
        ['Page 3', 'Profile content 14'],
      ],
      expectedUsage: {
        goto: 16,
        actions: [15, 12],
      },
    },

    // Strings as the commands
    {
      name: 'should handle next page pagination with strings @disabled',
      commands: [
        'click to go to the next page',
        'click each profile link',
      ],
      expected: [
        ['Page 1', 'Profile content 1'],
        ['Page 1', 'Profile content 2'],
        ['Page 1', 'Profile content 3'],
        ['Page 1', 'Profile content 4'],
        ['Page 1', 'Profile content 5'],

        ['Page 2', 'Profile content 6'],
        ['Page 2', 'Profile content 7'],
        ['Page 2', 'Profile content 8'],
        ['Page 2', 'Profile content 9'],
        ['Page 2', 'Profile content 10'],

        ['Page 3', 'Profile content 11'],
        ['Page 3', 'Profile content 12'],
        ['Page 3', 'Profile content 13'],
        ['Page 3', 'Profile content 14'],
        ['Page 3', 'Profile content 15'],
      ],
      expectedUsage: {
        goto: 19,
        actions: [21, 19],
      },
    },
  ];

  for (const { name, commands, expected, expectedUsage } of cases) {

    it(name, async () => {
      const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
<!DOCTYPE html>
<html>
  <body>
    <h1 id="page-label"></h1>
    <div id="nav">
      <button id="next-page">Next Page</button>
      <div id="buttons"></div>
    </div>
    <div id="profile"></div>

    <script>
     let page = 1;
     let profile;

     function render() {
       document.getElementById("page-label").textContent = "Page " + page;
       const el = document.getElementById('buttons');
       el.innerHTML = '';

       for (let i = 0; i < 5; i++) {
         const num = (page - 1) * 5 + i + 1;
         el.innerHTML += '<button class="profile-btn" onClick="profile=' + num + ';render()">profile ' + num + '</button>';
       }

       if (profile) {
         document.getElementById('nav').innerHTML = '';
         document.getElementById('profile').innerHTML = 'Profile content ' + profile;
       }
     }

     document.getElementById("next-page").addEventListener("click", function() {
       page++;
       profile = null;
       render();
     });

     render();
    </script>
  </body>
</html>
`
        );
      });

      await new Promise(ok => server.listen(0, ok));
      const port = server.address().port;

      try {
        const cache = testCache();
        const ai = getAI('openai:gpt-4o', { cache });
        const fetcher = getFetcher(
          'playwright',
          { ai, loadWait: 1, actionWait: 1, headless: true });
        const url = `http://localhost:${port}`;

        const instr = new Instructions(url, commands, { ai });
        await instr.learn(fetcher);

        let i = 0;

        let doc;
        let usage;
        const gen = instr.execute(fetcher);
        for await ({ doc, usage } of gen) {
          if (!doc) {
            continue;
          }
          if (i >= expected.length) {
            break;
          }

          const $ = cheerio.load(doc.html);
          const page = $('#page-label').text();
          const profile = $('#profile').text();

          assert.equal(page, expected[i][0]);
          assert.equal(profile, expected[i][1]);

          i++;
        }

        assert.equal(JSON.stringify(usage), JSON.stringify(expectedUsage));

      } finally {
        server.close();
      }
    });

  }

  it('should handle load more pagination @disabled', async () => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
<!DOCTYPE html>
<html>
  <body>
    <h1 id="page-label"></h1>
    <div id="nav">
      <button id="next-page">Next Page</button>
      <div id="buttons"></div>
    </div>
    <div id="profile"></div>

    <script>
     let page = 1;
     let profile;

     function render() {
       document.getElementById("page-label").textContent = "Page " + page;
       const el = document.getElementById('buttons');

       for (let i = 0; i < 5; i++) {
         const num = (page - 1) * 5 + i + 1;
         el.innerHTML += '<button class="profile-btn" onClick="profile=' + num + ';render()">profile ' + num + '</button>';
       }

       if (profile) {
         document.getElementById('nav').innerHTML = '';
         document.getElementById('profile').innerHTML = 'Profile content ' + profile;
       }
     }

     document.getElementById("next-page").addEventListener("click", function() {
       page++;
       profile = null;
       render();
     });

     render();
    </script>
  </body>
</html>
`
      );
    });

    await new Promise(ok => server.listen(0, ok));
    const port = server.address().port;

    try {
      const cache = testCache();
      const ai = getAI('openai:gpt-4o', { cache });
      const fetcher = getFetcher(
        'playwright',
        { ai, loadWait: 1, actionWait: 1, headless: true });
      const url = `http://localhost:${port}`;

      const commands = [
        { prompt: 'click to go to the next page', max: 3, repeat: 3 },
        { prompt: 'click each profile link', max: 4 },
      ];

      const instr = new Instructions(url, commands, { ai });
      await instr.learn(fetcher);

      const expected = [
        ['Page 1', 'Profile content 1'],
        ['Page 1', 'Profile content 2'],
        ['Page 1', 'Profile content 3'],
        ['Page 1', 'Profile content 4'],
        ['Page 2', 'Profile content 5'],
        ['Page 2', 'Profile content 6'],
        ['Page 2', 'Profile content 7'],
        ['Page 2', 'Profile content 8'],
        ['Page 3', 'Profile content 9'],
        ['Page 3', 'Profile content 10'],
        ['Page 3', 'Profile content 11'],
        ['Page 3', 'Profile content 12'],
      ];

      let i = 0;

      let doc;
      let usage;
      const gen = instr.execute(fetcher);
      for await ({ doc, usage } of gen) {
        if (!doc) {
          continue;
        }

        const $ = cheerio.load(doc.html);
        const page = $('#page-label').text();
        const profile = $('#profile').text();

        assert.equal(page, expected[i][0]);
        assert.equal(profile, expected[i][1]);

        i++;
      }

      assert.equal(usage.goto, 16, 'expected 16 gotos');
      assert.equal(usage.actions[0], 15, 'expected 15 (12 success + 3 failed) next page clicks');
      assert.equal(usage.actions[1], 12, 'expected 12 profile button clicks');

    } finally {
      server.close();
    }
  });

});
