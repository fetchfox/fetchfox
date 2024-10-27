import http from 'http';
import { WebSocketServer } from 'ws';
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

          console.log('Got plan request:', data);
          const f = await fox.plan(...data);
          const out = JSON.stringify(f.dump());
          console.log('Returning plan:', out);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(out);
        });
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    });

    // Set up the WebSocket server
    this.wss = new WebSocketServer({ server: this.s });

    this.wss.on('connection', ws => {
      console.log('New WebSocket connection');

      ws.on('message', async message => {
        console.log('Received WebSocket message:', message);

        const data = JSON.parse(message);

        console.log('==== wss got data ====');
        console.log(JSON.stringify(data, null, 2));
        console.log('plan it');
        const f = await fox.plan(...(data.workflow.steps));
        console.log('done: plan it');
        console.log('got plan:', JSON.stringify(f.dump(), null, 2));

        const out1 = await f.run(
          null,
          (r) => {
            // console.log('partial', r);
            ws.send(JSON.stringify(r));
          })

        throw 'wssss';

        // const f = await fox.plan(...data);
        const out = JSON.stringify({ status: 'ok!' });
        console.log('Returning WebSocket response:', out);

        ws.send(out);
        ws.close(1000);
      });

      ws.on('close', () => {
        console.log('WebSocket connection closed');
      });
    });

    console.log('wss:', this.wss);

    return this.s.listen(port, cb);
  }

  close(cb) {
    return this.s.close(cb);
  }
}
