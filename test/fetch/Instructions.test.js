import assert from 'assert';
import http from 'http';
import { logger } from '../../src/log/logger.js';
import { testCache } from '../lib/util.js';
import { getFetcher, getAI, Instructions } from '../../src/index.js';
import * as cheerio from 'cheerio';

describe('Instructions', function() {
  this.timeout(60 * 1000);

  it('should learn and execute @run @fast', async () => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
<!DOCTYPE html>
<html>
  <head>
    <title>Test Page</title>
    <script type="text/javascript">
     let didEnable = false;
     function enable() {
       if (didEnable) return;
       didEnable = true;
       for (var i = 0; i < 5; i++) {
         const button = document.createElement('button');
         button.textContent = 'Click Me To Swap Content ' + i;
         let str = 'New content ' + ('' + i).repeat(i);
         button.addEventListener('click', function () {
           document.getElementById("content").innerHTML = str;
         });
         document.body.appendChild(button);
       }
     }
    </script>
  </head>
  <body>
    <div id="content">Original content</div>
    <button id="some-button">A Button</button>
    <button id="enable-clicks" onClick="enable()">Enable Clicks</button>
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
      const fetcher = getFetcher('playwright', { ai, loadWait: 10 });
      const url = `http://localhost:${port}`;

      const commands = [
        { prompt: 'click on the button to enable interaction', max: 100 },
        { prompt: 'click on all the interaction buttons', max: 100 }
      ];

      const instr = new Instructions(url, commands, { ai });
      await instr.learn(fetcher);
      const gen = await instr.execute(fetcher);
      let i = 0;
      for await (const doc of gen) {
        const expected = 'New content ' + ('' + i).repeat(i);
        assert.ok(doc.html.includes(expected), `expect ${expected}`);
      }

    } finally {
      server.close();
    }
  });

  it('should paginate @run @fast', async () => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pagination Test</title>
          <script>
            let currentPage = 1;
            function goToNextPage() {
              currentPage++;
              document.getElementById('content').textContent = 'You are on page ' + currentPage;
            }
          </script>
        </head>
        <body>
          <div id="content">You are on page 1</div>
          <button id="next-page" onclick="goToNextPage()">Next Page</button>
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
      const fetcher = getFetcher('playwright', { ai, loadWait: 10 });
      const url = `http://localhost:${port}`;

      const commands = [
        { prompt: 'click to go to the next page', max: 1, repeat: 5 },
      ];

      const instr = new Instructions(url, commands, { ai });
      await instr.learn(fetcher);

      const gen = await instr.execute(fetcher);
      const docs = [];
      for await (const doc of gen) {
        docs.push(doc);
      }

      assert.equal(docs.length, 5);
      let i = 0;
      for (const doc of docs) {
        const expected = 'You are on page ' + (i + 1);
        i++;
        assert.ok(doc.html.includes(expected), `expect ${expected}`);
      }

    } finally {
      server.close();
    }
  });


  it('should handle two step dynamic page with url replaceState @run @fast', async () => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
<!DOCTYPE html>
<html>
  <body>
    <h1 id="page-label"></h1>
    <button id="next-page">Next Page</button>
    <div id="buttons"></div>
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
         history.replaceState({}, "", "/page-" + page + "/profile-" + profile);
         document.getElementById('profile').innerHTML = 'Profile content ' + profile;
       } else {
         document.getElementById('profile').innerHTML = '';
       }
     }

     document.getElementById("next-page").addEventListener("click", function() {
       page++;
       profile = null;
       history.replaceState({}, "", "/page-" + page);
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
      const fetcher = getFetcher('playwright', { ai, loadWait: 10 });
      const url = `http://localhost:${port}`;

      const commands = [
        { prompt: 'click to go to the next page', max: 5, repeat: 5 },
        { prompt: 'click each profile link', max: 5 },
      ];

      const instr = new Instructions(url, commands, { ai });
      await instr.learn(fetcher);
      console.log(instr);

      const gen = await instr.execute(fetcher);
      const docs = [];
      for await (const doc of gen) {
        console.log('doc:'+ doc);

        docs.push(doc);
      }

      return;

      assert.equal(docs.length, 5);
      let i = 0;
      for (const doc of docs) {
        const expected = 'You are on page ' + (i + 1);
        i++;
        assert.ok(doc.html.includes(expected), `expect ${expected}`);
      }

    } finally {
      server.close();
    }
  });

  it('should handle two step dynamic page, no url updates @run @fast', async () => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
<!DOCTYPE html>
<html>
  <body>
    <h1 id="page-label"></h1>
    <button id="next-page">Next Page</button>
    <div id="buttons"></div>
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
         document.getElementById('profile').innerHTML = 'Profile content ' + profile;
       } else {
         document.getElementById('profile').innerHTML = '';
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
      const fetcher = getFetcher('playwright', { ai, loadWait: 10 });
      const url = `http://localhost:${port}`;

      const commands = [
        { prompt: 'click to go to the next page', max: 3, repeat: 3 },
        { prompt: 'click each profile link', max: 3 },
      ];

      const instr = new Instructions(url, commands, { ai });
      await instr.learn(fetcher);

      const gen = await instr.execute(fetcher);
      const docs = [];

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

      assert.equal(usage.goto, 4, 'expected 4 gotos');
      assert.equal(usage.actions[0], 3, 'expected 3 next page clicks');
      assert.equal(usage.actions[1], 18, 'expected 18 (15 success + 3 failed) profile button clicks');

    } finally {
      server.close();
    }
  });

});
