import http from 'http';
import { WebSocketServer } from 'ws';
import { logger } from '../log/logger.js';
import { fox } from '../fox/fox.js';

export const Server = class {
  listen(port, cb) {
    this.s = http.createServer((req, res) => {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    });

    // Set up the WebSocket server
    this.wss = new WebSocketServer({ server: this.s });

    this.wss.on('connection', ws => {
      ws.on('message', async message => {
        const data = JSON.parse(message);
        console.log('got data', data);
        const f = await fox.plan(...(data.workflow.steps));
        console.log('got f', f);
        const out = await f.run(
          null,
          (r) => {
            ws.send(JSON.stringify(r));
          })

        // ws.send(out);
        ws.close(1000);
      });

      ws.on('close', () => {
        logger.info(`Close websocket connection`);
      });
    });

    return this.s.listen(port, cb);
  }

  close(cb) {
    return this.s.close(cb);
  }
}
