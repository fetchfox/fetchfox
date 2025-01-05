import assert from 'assert';
import os from 'os';
import http from 'http';
import { testCache } from '../lib/util.js';
import { getFetcher, getAI } from '../../src/index.js';

describe('PlaywrightFetcher', function() {

  it('should fetch @run', async () => {
    const fetcher = getFetcher('playwright', { loadWait: 1 });

    const gen = await fetcher.fetch('https://example.com');
    const doc = (await gen.next()).value;
    gen.return();

    assert.ok(doc.text.indexOf('Example Domain') != -1);
    assert.ok(doc.html.indexOf('Example Domain') != -1);
  });

  it('should abort @run', async () => {
    const controller = new AbortController();
    const signal = controller.signal;
    const fetcher = getFetcher('playwright', { loadWait: 1, signal });

    const start = (new Date()).getTime();
    const gen = await fetcher.fetch('https://example.com');
    const docPromise = gen.next();
    setTimeout(() => controller.abort(), 1);
    const doc = (await docPromise).value;
    const took = (new Date()).getTime() - start;
    gen.return();

    assert.ok(!doc);
    assert.ok(took < 500);
  });

  it('should fetch live site @run @fast', async () => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<html><body><h1>Hello, world!</h1></body></html>');
    });
    const port = 3030;
    await new Promise(ok => server.listen(port, ok));

    try {
      const cache = testCache();
      const ai = getAI('openai:gpt-4o-mini', { cache });
      const fetcher = getFetcher('playwright', { ai, loadWait: 1 });
      const gen = await fetcher.fetch(`http://localhost:${port}`);
      const doc = (await gen.next()).value;
      gen.return();

      assert.ok(doc.text.includes('Hello, world!'));
      assert.ok(doc.html.includes('<h1>Hello, world!</h1>'));
    } finally {
      server.close();
    }
  });

  it('should fetch live site with dynamic content @run @fast', async () => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Page</title>
          <script>
            setTimeout(() => {
              const dynamicContent = document.createElement('div');
              dynamicContent.id = 'dynamic-content';
              dynamicContent.textContent = 'Dynamic Content Loaded';
              document.body.appendChild(dynamicContent);
            }, 5);
          </script>
        </head>
        <body>
          <h1>Static Content</h1>
        </body>
      </html>
    `);
    });

    const port = 3030;
    await new Promise(ok => server.listen(port, ok));

    try {
      const cache = testCache();
      const ai = getAI('openai:gpt-4o-mini', { cache });
      const fetcher = getFetcher('playwright', { ai, loadWait: 10 });
      const gen = await fetcher.fetch(`http://localhost:${port}`);
      const doc = (await gen.next()).value;
      gen.return();

      assert.ok(doc.text.includes('Static Content'), 'static content check');
      assert.ok(doc.text.includes('Dynamic Content Loaded'), 'dynamic content check');
      assert.ok(doc.html.includes('<div id="dynamic-content">Dynamic Content Loaded</div>'), 'dynamic html check');
    } finally {
      server.close();
    }
  });

  it('should fetch and paginate through 5 pages on a live site @run @fast', async () => {
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
    `);
    });

    const port = 3030;
    await new Promise(ok => server.listen(port, ok));


    try {
      const cache = testCache();
      const ai = getAI('openai:gpt-4o-mini', { cache });
      const fetcher = getFetcher('playwright', { ai, loadWait: 10, paginationWait: 1 });
      const gen = fetcher.fetch(`http://localhost:${port}`, { maxPages: 5 });

      let i = 1;
      for await (const doc of gen) {
        assert.ok(doc.html.includes(`You are on page ${i}`), `page html ${i}`);
        i++;
      }

      assert.equal(i - 1, 5, '5 pages');

    } finally {
      server.close();
    }
  });

});
