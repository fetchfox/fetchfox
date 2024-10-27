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
        const f = await fox.plan(...(data.workflow.steps));
        const out = await f.run(
          null,
          (r) => {
            ws.send(JSON.stringify(r));
          });
        logger.info(`Server side run done: ${JSON.stringify(out).substr(0, 120)}`);
        ws.send(JSON.stringify({ close: true, out }));
        ws.close(1000);
      });

      ws.on('close', () => {
        logger.info(`Server side close websocket connection`);
      });
    });

    return this.s.listen(port, cb);
  }

  close(cb) {
    return this.s.close(cb);
  }
}
