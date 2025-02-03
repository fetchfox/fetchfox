import assert from 'assert';
import http from 'http';
import { logger } from '../../src/log/logger.js';
import { testCache } from '../lib/util.js';
import { getFetcher, getAI, Instructions } from '../../src/index.js';
import * as cheerio from 'cheerio';

describe('Instructions', function() {
  this.timeout(60 * 1000);

  it('should handle paginated profiles @run @fast', async () => {
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
      const fetcher = getFetcher('playwright', { ai, loadWait: 10, headless: true });
      const url = `http://localhost:${port}`;

      const commands = [
        { prompt: 'click to go to the next page', max: 3, repeat: 3 },
        { prompt: 'click each profile link', max: 3 },
      ];

      const instr = new Instructions(url, commands, { ai });
      await instr.learn(fetcher);

      console.log(instr.learned);

      const expected = [
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
      ];

      let i = 0;

      let doc;
      let usage;
      const gen = instr.execute(fetcher);
      for await ({ doc, usage } of gen) {
        console.log('got gen' + doc);

        if (!doc) {
          continue;
        }

        const $ = cheerio.load(doc.html);
        const page = $('#page-label').text();
        const profile = $('#profile').text();

        console.log(`result page=${page} profile=${profile}`);

        // assert.equal(page, expected[i][0]);
        // assert.equal(profile, expected[i][1]);

        i++;
      }

      // assert.equal(usage.goto, 4, 'expected 4 gotos');
      // assert.equal(usage.actions[0], 3, 'expected 3 next page clicks');
      // assert.equal(usage.actions[1], 18, 'expected 18 (15 success + 3 failed) profile button clicks');

    } finally {
      server.close();
    }
  });
});
