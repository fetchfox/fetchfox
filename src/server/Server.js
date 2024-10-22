import http from 'http';

import { fox } from '../fox/fox.js';

export const Server = class {
  listen(port, cb) {
    const s = http.createServer((req, res) => {
      // console.log('req', req);

      if (req.method === 'POST' && req.url === '/plan') {
        let body = '';

        // Collect data from the request
        req.on('data', chunk => {
          body += chunk.toString(); // Convert buffer to string
        });

        req.on('end', async () => {
          // Set headers and respond with the same data

          console.log('got body:', body);
          let data;
          try {
            let data = JSON.parse(body);
          } catch(e) {
            data = body;
          }
          console.log('got data:', data);

          const f = await fox.plan(data);
          const out = JSON.stringify(f.dump());
          console.log('plan', f.dump());

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(out); // Echo back the received data
        });
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    });

    console.log('listen on', port);

    return s.listen(port, cb);
  }
}
