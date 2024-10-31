import { logger } from '../log/logger.js';
import ShortUniqueId from 'short-unique-id';
import { getWebSocket } from '../util.js';

export const Receiver = class {
  constructor(host) {
    this.host = host || 'ws://127.0.0.1:9090';
    this.cb = [];
  }

  async connect() {
    if (this.ws) {
      throw new Error('already connected');
    }

    const id = 'relay_' +(new ShortUniqueId({
      length: 10,
      dictionary: 'alphanum_lower',
    })).rnd();

    logger.info(`Connecting relay on ${id}`);

    const WebSocket = await getWebSocket();
    this.ws = new WebSocket(this.host);
    return new Promise((ok, err) => {
      this.ws.onopen = () => {
        this.ws.send(JSON.stringify({ command: 'relayListen', id }));
        ok(id);
      }

      this.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        logger.debug(`Client side relay got message ${JSON.stringify(data)}`);
        this.trigger(data);
      }

      this.ws.onerror = (e) => {
        logger.error(`Client side relay error: ${e}`);
        err(e);
      }
    });
  }

  listen(cb) {
    this.cb.push(cb);
  }

  trigger(data) {
    logger.debug(`Client side relay got ${JSON.stringify(data)}`);
    for (const cb of this.cb) {
      cb(data);
    }
  }

  async close() {
    const ws = this.ws;
    this.ws = null;
    ws.close(1000);
    this.cb = [];
    return new Promise((ok) => ws.onclose = ok);
  }
}
