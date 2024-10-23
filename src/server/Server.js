import http from 'http';

import { fox } from '../fox/fox.js';

export const Server = class {
  listen(port, cb) {
    this.s = http.createServer((req, res) => {
      if (req.method === 'POST' && req.url === '/plan') {
        let body = '';

        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', async () => {
          const data = JSON.parse(body);
          const f = await fox.plan(...data);
          const out = JSON.stringify(f.dump(), null, 2);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(out);
        });
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    });

    return this.s.listen(port, cb);
  }

  close(cb) {
    return this.s.close(cb);
  }
}
