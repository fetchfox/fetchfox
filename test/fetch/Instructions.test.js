import assert from 'assert';
import http from 'http';
import { logger } from '../../src/log/logger.js';
import { testCache, setTestTimeout } from '../lib/util.js';
import { getFetcher, getAI, Instructions } from '../../src/index.js';
import * as cheerio from 'cheerio';

describe('Instructions', function() {

  // TODO: fix caching on these to bring down test times
  setTestTimeout(this, 15 * 1000);

  before(() => {
    logger.testMode();
  });

  const cases = [
    // Objects as the commands
    {
      name: 'should handle next page pagination with objects @fast',
      commands: [
        { prompt: 'click to go to the next page', mode: 'repeat' },
        { prompt: 'click each profile link', mode: 'distinct', limit: 12 },
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
      ],
    },

    // Strings as the commands
    {
      name: 'should handle next page pagination with strings @fast',
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
    },
  ];

  for (const { name, commands, expected } of cases) {

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
        const fetcher = getFetcher('playwright', { ai, cache, wait: 10, timeout: 100 });
        const url = `http://localhost:${port}`;

        const instr = new Instructions(url, commands, { ai });
        for await (const unused of instr.learn(fetcher)) {}

        let i = 0;

        let doc;
        const gen = instr.execute(fetcher);
        for await (const { doc } of gen) {
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

      } finally {
        server.close();
      }
    });

  }

  it('should handle load more pagination @fast', async () => {
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
      const fetcher = getFetcher('playwright', { ai, cache, wait: 10, timeout: 100 });
      const url = `http://localhost:${port}`;

      const commands = [
        { prompt: 'click to go to the next page', mode: 'repeat', limit: 3 },
      ];

      const instr = new Instructions(url, commands, { ai });
      for await (const unused of instr.learn(fetcher)) {}

      const expected = [
        'Page 1',
        'Page 2',
        'Page 3',
      ];

      let i = 0;

      const gen = instr.execute(fetcher);
      for await (const { doc } of gen) {
        if (!doc) {
          continue;
        }

        const $ = cheerio.load(doc.html);
        const page = $('#page-label').text();
        const profile = $('#profile').text();

        assert.equal(page, expected[i]);
        i++;
      }

    } finally {
      server.close();
    }
  });

  it('should handle next page pagination and optimize single repeat @fast', async () => {
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
              document.getElementById('page-label').textContent = 'Page ' + currentPage;
            }
          </script>
        </head>
        <body>
          <div id="page-label">Page 1</div>
          <button id="next-page" onclick="goToNextPage()">Next Page</button>
        </body>
      </html>
    `);
    });

    await new Promise(ok => server.listen(0, ok));
    const port = server.address().port;

    try {
      const cache = testCache();
      const ai = getAI('openai:gpt-4o', { cache });
      const fetcher = getFetcher('playwright', { ai, cache, wait: 10, timeout: 100 });
      const url = `http://localhost:${port}`;
      const commands = [{ prompt: '{{nextPage}}', limit: 4 }];

      const instr = new Instructions(url, commands, { ai });
      for await (const unused of instr.learn(fetcher)) {}

      const expected = [
        'Page 1',
        'Page 2',
        'Page 3',
        'Page 4',
      ];

      let i = 0;
      const gen = instr.execute(fetcher);
      let usage;
      for await (const r of gen) {
        const doc = r.doc;
        usage = r.usage;
        if (!doc) {
          continue;
        }

        const $ = cheerio.load(doc.html);
        const page = $('#page-label').text();

        assert.equal(page, expected[i]);

        i++;
      }

      // Verify that single repeat has O(N) usage of goto
      assert.equal(fetcher.usage.goto, 2);
      assert.equal(usage.goto, 1);
      assert.equal(usage.actions[0], 3);

    } finally {
      server.close();
    }
  });

  it('should handle load more pagination and click profiles @fast', async () => {
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
      const fetcher = getFetcher('playwright', { ai, cache, wait: 10, timeout: 100 });
      const url = `http://localhost:${port}`;

      const commands = [
        { prompt: 'click to go to the next page', mode: 'repeat' },
        { prompt: 'click each profile link', mode: 'distinct', limit: 12 },
      ];

      const instr = new Instructions(url, commands, { ai });
      for await (const unused of instr.learn(fetcher)) {}

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
      ];

      let i = 0;
      const gen = instr.execute(fetcher);
      for await (const { doc } of gen) {
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

    } finally {
      server.close();
    }
  });

  it('should handle cookie button before pagination @fast', async () => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
<!DOCTYPE html>
<html>
  <body>
    <div>
      <h1 id="page-label"></h1>
      <button id="next-page">Next Page</button>
      <div id="main">
        <div id="buttons"></div>
        <div id="profile"></div>
      </div>

      <button id="cookie-button" onClick="cookieOk=true; render(); this.remove()">Accept Cookies</button>

      <script type="text/javascript">
       let page = 1;
       let profile;
       let cookieOk = false;

       function render() {
         if (!cookieOk) {
           return;
         }

         document.getElementById("page-label").textContent = "Page " + page;
         const el = document.getElementById('buttons');
         el.innerHTML = '';

         for (let i = 0; i < 5; i++) {
           const num = (page - 1) * 5 + i + 1;
           el.innerHTML += '<button class="profile-btn" onClick="profile=' + num + ';render()">profile ' + num + '</button>';
         }

         if (profile) {
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
    </div>
  </body>
</html>
`
      );
    });

    await new Promise(ok => server.listen(0, ok));
    const port = server.address().port;

    const cache = testCache();
    const ai = getAI('openai:gpt-4o', { cache });
    const url = `http://localhost:${port}`;

    const fetcherCtx = {};
    const fetcher = getFetcher('playwright', { ai, cache, wait: 10, timeout: 100 });

    const limit = 4;

    try {
      const commands = [
        { prompt: 'click accept cookies', optional: true, mode: 'first' },
        { prompt: 'click to go to the next page', mode: 'repeat', limit },
      ];

      await fetcher.start(fetcherCtx);

      const instr = new Instructions(url, commands, { ai, cache });
      for await (const unused of instr.learn(fetcher, fetcherCtx)) {}

      const expected = [
        'Page 1',
        'Page 2',
        'Page 3',
        'Page 4',
      ];

      let i = 0;

      let doc;
      const gen = instr.execute(fetcher, fetcherCtx);
      for await ({ doc } of gen) {
        if (!doc) {
          continue;
        }

        const $ = cheerio.load(doc.html);
        const page = $('#page-label').text();

        assert.equal(page, expected[i]);

        i++;
      }

      assert.equal(i, limit);

    } finally {
      fetcher.finish(fetcherCtx);
      server.close();
    }
  });

  it('should handle non visible cookie button before pagination @fast', async () => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
<!DOCTYPE html>
<html>
  <body>
    <div>
      <h1 id="page-label"></h1>
      <button id="next-page">Next Page</button>
      <div id="main">
        <div id="buttons"></div>
        <div id="profile"></div>
      </div>

      <button id="cookie-button" style="display: none;" onClick="cookieOk=true; render(); this.remove()">Accept Cookies</button>
      <button id="cookie-button" style="visibility: hidden;" onClick="cookieOk=true; render(); this.remove()">Accept Cookies</button>
      <button id="cookie-button" onClick="cookieOk=true; render(); this.remove()">Accept Cookies</button>

      <script type="text/javascript">
       let page = 1;
       let profile;
       let cookieOk = false;

       function render() {
         if (!cookieOk) {
           return;
         }

         document.getElementById("page-label").textContent = "Page " + page;
         const el = document.getElementById('buttons');
         el.innerHTML = '';

         for (let i = 0; i < 5; i++) {
           const num = (page - 1) * 5 + i + 1;
           el.innerHTML += '<button class="profile-btn" onClick="profile=' + num + ';render()">profile ' + num + '</button>';
         }

         if (profile) {
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
    </div>
  </body>
</html>
`
      );
    });

    await new Promise(ok => server.listen(0, ok));
    const port = server.address().port;

    const cache = testCache();
    const ai = getAI('openai:gpt-4o', { cache });
    const url = `http://localhost:${port}`;

    const fetcherCtx = {};
    const fetcher = getFetcher('playwright', { ai, cache, wait: 10, timeout: 100 });

    const limit = 4;

    try {
      const commands = [
        { prompt: 'click accept cookies', optional: true, mode: 'first' },
        { prompt: 'click to go to the next page', mode: 'repeat', limit },
      ];

      await fetcher.start(fetcherCtx);

      const instr = new Instructions(url, commands, { ai, cache });
      for await (const unused of instr.learn(fetcher, fetcherCtx)) {}

      const expected = [
        'Page 1',
        'Page 2',
        'Page 3',
        'Page 4',
      ];

      let i = 0;

      let doc;
      const gen = instr.execute(fetcher, fetcherCtx);
      for await ({ doc } of gen) {
        if (!doc) {
          continue;
        }

        const $ = cheerio.load(doc.html);
        const page = $('#page-label').text();

        assert.equal(page, expected[i]);

        i++;
      }

      assert.equal(i, limit);

    } finally {
      fetcher.finish(fetcherCtx);
      server.close();
    }
  });

});
