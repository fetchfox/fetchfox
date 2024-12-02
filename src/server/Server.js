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

    this.store = options?.store || new Store();
    this.onError = options?.onError;

    this.conns = new Set();
    this.relay = new Relay();
    this.middleware = [];
    this.children = {};
    this.childPath = (
      options.childPath ||
      path.join(
        process.cwd(),
        'node_modules/fetchfox/src/server/child.js'));

    this.shouldPrefork = options?.shouldPrefork;
    this.shouldPrefork && this.prefork();
  }

  pushMiddleware(mw) {
    this.middleware.push(mw);
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

  async safeSend(child, payload) {
    if (!child.connected) {
      logger.warn(`Child process ${child} is no longer connected`);
      return;
    }

    return child.send(payload);
  }

  prefork() {
    const id = this.store.nextId();
    const child = fork(this.childPath);
    this.children[id] = child;
    this.nextForkId = id;
  }

  fork() {
    if (!this.nextForkId) {
      this.prefork();
    }

    if (!this.nextForkId) {
      logger.error(`No next fork ID after prefork`);
      return;
    }

    const id = this.nextForkId;
    const child = this.children[id];
    this.nextForkId = null;

    setTimeout(
      () => { this.shouldPrefork && this.prefork() },
      1);

    return { id, child };
  }

  async ping(data, ws) {
    // logger.info(`Server start ${JSON.stringify(data)}`);
    return { command: 'pong' };
  }

  async start(data, ws) {
    logger.info(`Server start ${JSON.stringify(data)}`);

    const start = (new Date()).getTime();
    const { id, child } = this.fork();
    const took = (new Date()).getTime() - start;
    logger.debug(`Start took ${took} msec to fork`);

    child.on('message', (msg) => {
      const { command, data } = msg;

      switch (command) {
        case 'partial':
          this.store.pub(id, data);
          break;

        case 'stop':
        case 'final':
          this.store.finish(id, data);
          this.safeSend(child, { command: 'exit' });
          break;

        case 'error':
          if (this.onError) {
            this.onError(data);
          }
          this.store.finish(id);
          break;

        default:
          throw new Error(`Unhandled child command: ${command} ${data}`);
      }
    });

    this.safeSend(child, { command: 'start', id, data });
    return id;
  }

  async stop(data) {
    logger.info(`Server stop ${JSON.stringify(data)}`);
    const id = data.id;
    if (this.children[id]) {
      const child = this.children[id];
      this.safeSend(child, { command: 'stop' });
    }
    this.store.finish(id);
  }

  async plan(data, ws) {
    logger.info(`Plan based on ${JSON.stringify(data.prompt).substr(0, 200)}`);
    const f = await fox.plan(...(data.prompt));
    return f.dump();
  }

  async describe(data, ws) {
    logger.info(`Describe based on ${JSON.stringify(data.workflow).substr(0, 200)}`);
    const f = await fox.describe(data.workflow);
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
        let data = JSON.parse(msg);
        let end;
        let out;

        for (const mw of this.middleware) {
          const result = mw(data);
          if (result.end) {
            end = result.end;
            break;
          }
        }

        const original = JSON.parse(JSON.stringify(data));

        if (!end) {
          switch (data.command) {
            case 'ping':
              out = await this.ping(data, ws);
              break;
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
            case 'describe':
              out = await this.describe(data, ws);
              break;
            case 'relayListen':
              out = await this.relayListen(data, ws);
              break;
            case 'relaySend':
              out = await this.relaySend(data, ws);
              break;
          }
        }

        if (data.command != 'ping') {
          logger.info(`Server side run of ${data.command} done: ${(JSON.stringify(out) || '').substr(0, 120)}`);
        }

        // TODO: Keep connection alive in general, instead of closing on each command
        const command = out?.command;

        if (end) {
          out = end;
        }

        let resp = {
          request: original,
          command,
          out,
          close: true,
        };

        if (!end) {
          for (const mw of this.middleware) {
            resp = mw(resp);
          }
        }

        ws.send(JSON.stringify(resp));
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
