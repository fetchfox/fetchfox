import path from 'path';
import { fork } from 'child_process';
import http from 'http';
import { WebSocketServer } from 'ws';
import { logger } from '../log/logger.js';
import { fox } from '../fox/fox.js';
import { Relay } from '../relay/Relay.js';
import { Store } from './Store.js';

export const Server = class {
  constructor(options) {
    options ||= {};

    this.conns = new Set();
    this.store = new Store();
    this.relay = new Relay();
    this.children = {};
    this.childPath = (
      options.childPath ||
      path.join(
        process.cwd(),
        'node_modules/fetchfox/src/server/child.js'));
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

  async relayListen(data, ws) {
    return new Promise((ok) => {
      this.relay.listen(
        data.id,
        (r) => {
          ws.send(JSON.stringify(r));
        }
      );
    });
  }

  async relaySend(data, ws) {
    const { command, id, ...rest } = data;
    logger.info(`Server got relaySend ${rest.data.msgId}: ${JSON.stringify(data).substr(0,200)}`);
    return new Promise((ok) => {
      this.relay.send(id, rest.data);
    });
  }

  async start(data, ws) {
    logger.info(`Server start ${JSON.stringify(data)}`);
    const id = this.store.nextId();
    const child = fork(this.childPath);
    this.children[id] = child;

    child.on('message', ({ command, data }) => {
      switch (command) {
        case 'partial':
          this.store.pub(id, data);
          break;

        case 'stop':
        case 'final':
          this.store.finish(id, data);
          child.send({ command: 'exit' });
          break;

        default:
          throw new Error(`Unhandled child command: ${command} ${data}`);
      }
    });

    child.send({ command: 'start', id, data });
    return id;
  }

  async stop(data) {
    logger.info(`Server stop ${JSON.stringify(data)}`);
    const id = data.id;
    if (!this.children[id]) {
      logger.warn(`No child process to stop ${id}`);
      return;
    }

    const child = this.children[id];
    child.send({ command: 'stop' });
  }

  async plan(data, ws) {
    logger.info(`Plan based on ${JSON.stringify(data.prompt).substr(0, 200)}`);
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
      this.conns.add(ws);

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
          case 'relayListen':
            out = await this.relayListen(data, ws);
            break;
          case 'relaySend':
            out = await this.relaySend(data, ws);
            break;
        }

        logger.info(`Server side run of ${data.command} done: ${(JSON.stringify(out) || '').substr(0, 120)}`);
        ws.send(JSON.stringify({ close: true, out }));
        ws.close(1000);

        this.conns.delete(ws);
      });
    });

    logger.info(`Fox server listen on ${port}`);
    return this.s.listen(port, cb);
  }

  close(cb) {
    return this.s.close(cb);
  }
}
