import { fork } from 'child_process';
import http from 'http';
import { WebSocketServer } from 'ws';
import { logger } from '../log/logger.js';
import { fox } from '../fox/fox.js';
import { Store } from './Store.js';

export const Server = class {
  constructor() {
    this.store = new Store();
    this.children = {};
  }

  async sub(data, ws) {
    return new Promise((ok) => {
      this.store.sub(
        data.id,
        (r) => {
          r.id = data.id;
          if (r.done) {
            ok(r);
          } else {
            ws.send(JSON.stringify(r));
          }
        });
    });
  }

  async start(data, ws) {
    logger.info(`Server start ${JSON.stringify(data, null, 2)}`);
    const id = this.store.nextId();
    const child = fork('./src/server/child.js');

    this.children[id] = child;

    child.on('message', ({ command, data }) => {
      console.log('Message from child:', command, data);
      switch (command) {
        case 'partial':
          this.store.pub(id, data);
          break;

        case 'stop':
          console.log('Got STOP data', data);
        case 'final':
          this.store.finish(id, data);
          break;

        default:
          throw new Error(`Unhandled child command: ${command} ${data}`);
      }
    });

    child.send({ command: 'start', id, data });
    return id;
  }

  async stop(data) {
    logger.info(`Server stop ${JSON.stringify(data, null, 2)}`);
    const id = data.id;
    if (this.children[id]) {
      const child = this.children[id];
      child.send({ command: 'stop' });
      // const out = await this.workflows[id].stop();
      // console.log('STOP GOT:', out);
     return 'ok';
    } else {
      return null;
    }
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

    this.wss = new WebSocketServer({ server: this.s });

    this.wss.on('connection', ws => {
      ws.on('message', async (msg) => {
        const data = JSON.parse(msg);

        let out;
        switch (data.command) {
          case 'start':
            out = await this.start(data, ws);
            break;
          case 'stop':
            out = await this.stop(data, ws);
            break;
          case 'sub':
            out = await this.sub(data, ws);
            break;
          case 'plan':
            out = await this.plan(data, ws);
            break;
        }

        logger.info(`Server side run of ${data.command} done: ${JSON.stringify(out).substr(0, 120)}`);
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
