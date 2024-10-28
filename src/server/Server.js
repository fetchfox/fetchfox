import http from 'http';
import { WebSocketServer } from 'ws';
import { logger } from '../log/logger.js';
import { fox } from '../fox/fox.js';

export const Server = class {
  async run(data, ws) {
    logger.info(`Server run ${JSON.stringify(data, null, 2)}`);
    const f = await fox.plan(...(data.workflow.steps));
    const out = await f.run(
      null,
      (r) => {
        ws.send(JSON.stringify(r));
      });
    return out;
  }

  async plan(data, ws) {
    const f = await fox.plan(...(data.prompt));
    return f.dump();
  }

  listen(port, cb) {
    this.s = http.createServer((req, res) => {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    });

    // Set up the WebSocket server
    this.wss = new WebSocketServer({ server: this.s });

    this.wss.on('connection', ws => {
      ws.on('message', async (msg) => {
        const data = JSON.parse(msg);

        let out;
        switch (data.command) {
          case 'run':
            out = await this.run(data, ws);
            break;
          case 'plan':
            out = await this.plan(data, ws);
            break;
        }

        logger.info(`Server side run done: ${JSON.stringify(out).substr(0, 120)}`);
        ws.send(JSON.stringify({ close: true, out }));
        ws.close(1000);
      });
    });

    logger.info(`Fox server listen on ${port}`);
    return this.s.listen(port, cb);
  }

  close(cb) {
    return this.s.close(cb);
  }
}
