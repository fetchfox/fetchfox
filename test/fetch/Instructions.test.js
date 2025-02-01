import assert from 'assert';
import http from 'http';
import { logger } from '../../src/log/logger.js';
import { testCache } from '../lib/util.js';
import { getFetcher, getAI, Instructions } from '../../src/index.js';

describe('Instructions', function() {
  this.timeout(60 * 1000);

  it('should learn and execute @run', async () => {
    console.log('fetch instructions');

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
        'click on the button to enable interaction',
        'click on all the interaction buttons',
      ];

      const inst = new Instructions(url, commands, { ai });
      await inst.learn(fetcher);

      const gen = await fetcher.execute(inst);
      let i = 0;
      for await (const doc of gen) {
        const expected = 'New content ' + ('' + i).repeat(i);
        assert.ok(doc.html.includes(expected), `expect ${expected}`);
      }

    } finally {
      server.close();
    }
  });

});
