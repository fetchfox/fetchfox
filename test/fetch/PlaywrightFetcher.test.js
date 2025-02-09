import assert from 'assert';
import http from 'http';
import { logger } from '../../src/log/logger.js';
import { testCache } from '../lib/util.js';
import { getFetcher, getAI } from '../../src/index.js';
import { Instructions } from '../../src/fetch/Instructions.js';

describe('PlaywrightFetcher', function() {

  // Playwright tests take a little longer to execute
  this.timeout(60 * 1000);

  before(() => {
    logger.testMode();
  });

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

    await new Promise(ok => server.listen(0, ok));
    const port = server.address().port;

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

    await new Promise(ok => server.listen(0, ok));
    const port = server.address().port;

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

    await new Promise(ok => server.listen(0, ok));
    const port = server.address().port;

    try {
      const cache = testCache();
      const ai = getAI('openai:gpt-4o-mini', { cache });
      const fetcher = getFetcher(
        'playwright',
        { ai, cache, loadWait: 10, actionWait: 10, headless: true });
      const gen = fetcher.fetch(`http://localhost:${port}`, { maxPages: 5 });

      let i = 1;
      for await (const doc of gen) {
        assert.ok(doc.html.includes(`You are on page ${i}`), `page html ${i}`);
        i++;
      }

      assert.equal(i - 1, 5, 'expect 5 pages');

    } finally {
      server.close();
    }
  });

  it('should timeout properly @run @fast', async () => {
    const server = http.createServer(async (req, res) => {
      await new Promise(ok => setTimeout(ok, 20));
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

    await new Promise(ok => server.listen(0, ok));
    const port = server.address().port;

    try {
      const cache = testCache();
      const ai = getAI('openai:gpt-4o-mini', { cache });
      const fetcher = getFetcher('playwright', { ai, loadWait: 20, loadTimeout: 10 });
      const gen = await fetcher.fetch(`http://localhost:${port}`);
      const doc = (await gen.next()).value;
      gen.return();

      assert.equal(doc, null, 'timeout should give null');

    } finally {
      server.close();
    }
  });

  it('should minimize HTML content @run @fast', async () => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Minimization Test</title>
          <style>
            body { color: black; }
          </style>
          <script>
            let x = 'This should be removed';
          </script>
        </head>
        <body>
          <h1>Static Content</h1>
          <div style="color: white">Inline styled element</div>
          <a href="https://www.example.com" style="color: white">Keep A Tags</a>
        </body>
      </html>
    `);
    });

    await new Promise(ok => server.listen(0, ok));
    const port = server.address().port;

    try {
      const cache = testCache();
      const fetcher = getFetcher(
        'playwright',
        {
          loadWait: 1,
          headless: true,
        });
      const gen = await fetcher.fetch(`http://localhost:${port}`);
      const doc = (await gen.next()).value;
      gen.return();


      assert.equal(doc.html, `<html><head> <title>Minimization Test</title> </head> <body> <h1>Static Content</h1> <div>Inline styled element</div> <a href="https://www.example.com">Keep A Tags</a> </body></html>`);
      assert.equal(doc.text, `Minimization Test Static Content Inline styled element Keep A Tags`);
      assert.equal(doc.richText, `Minimization Test Static Content Inline styled element <a href="https://www.example.com">Keep A Tags</a>`);

      assert.ok(!doc.html.includes('<style>'), 'style tags should be removed');
      assert.ok(!doc.html.includes('<script>'), 'script tags should be removed');
      assert.ok(doc.html.includes('<h1>Static Content</h1>'), 'static content should remain intact');
      assert.ok(!doc.html.includes('style="color: red;"'), 'Inline style attributes should be removed');
    } finally {
      server.close();
    }
  });


  it('should fetch pdf @run @fast', async () => {
    const cache = testCache();
    const fetcher = getFetcher('playwright', { cache, loadWait: 1 });

    const gen = await fetcher.fetch('https://ffcloud.s3.us-west-2.amazonaws.com/misc/bitcoin.pdf');
    const doc = (await gen.next()).value;
    gen.return();

    assert.ok(doc.text.indexOf('bitcoin') != -1);
  });
    
  it('should handle protected pdf @run @fast', async () => {
    const cache = testCache();
    const fetcher = getFetcher('playwright', { cache, loadWait: 1 });

    const gen = await fetcher.fetch('https://ffcloud.s3.us-west-2.amazonaws.com/misc/quicksort.pdf');
    const doc = (await gen.next()).value;
    gen.return();

    assert.ok(!doc.html, 'expect empty html for protected pdf')
  });

});
