import { logger } from '../log/logger.js';
import { getWebSocket } from '../util.js';

export const Sender = class {
  constructor(host) {
    this.host = host || 'ws://127.0.0.1:9090';
    this.cb = [];
  }

  async connect(id) {
    if (this.ws) {
      throw new Error('already connected');
    }
    const WebSocket = await getWebSocket();
    this.ws = new WebSocket(this.host);
    return new Promise((ok, err) => {
      this.ws.onopen = () => {
        ok();
      }
    });
  }

  async send(id, data) {
    return this.ws.send(JSON.stringify({ command: 'relaySend', id, ...data }));
  }

  async close() {
    const ws = this.ws;
    this.ws = null;
    ws.close(1000);
    return new Promise((ok) => ws.onclose = ok);
  }
}
