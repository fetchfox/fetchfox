import { logger } from '../log/logger.js';
import { getWebSocket } from '../util.js';
import ShortUniqueId from 'short-unique-id';

export const Client = class {
  constructor(host) {
    this.host = host || 'ws://127.0.0.1:9090';
    this.cb = null;
    this.replyCb = {};
    this.sent = {};
  }

  isConnected() {
    return !!this.ws;
  }

  async connect(id) {
    if (this.ws) {
      throw new Error('already connected');
    }

    if (!id) {
      id = 'relay_' +(new ShortUniqueId({
        length: 10,
        dictionary: 'alphanum_lower',
      })).rnd();
    }

    this.id = id;

    const WebSocket = await getWebSocket();
    this.ws = new WebSocket(this.host);
    return new Promise((ok, err) => {
      this.ws.onopen = () => {
        this.ws.send(JSON.stringify({ command: 'relayListen', id }));
        ok(id);
      }

      this.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        this._receive(data);
      }

      this.ws.onerror = (e) => {
        err(e);
      }
    });
  }

  listen(cb) {
    if (this.cb) {
      throw new Error('Only one listener allowed');
    }

    this.cb = cb;
  }

  unlisten() {
    this.cb = null;
  }

  async _receive(data) {
    if (this.sent[data.msgId]) {
      return;
    }

    if (data.replyToId) {
      logger.debug(`Relay client got a reply to ${data.replyToId}: ${JSON.stringify(data).substr(0, 140)}`);
      const replyCb = this.replyCb[data.replyToId];
      delete this.replyCb[data.replyToId];
      replyCb(data.reply);
      return;
    }

    logger.debug(`Relay client got: ${JSON.stringify(data).substr(0, 140)}`);
    let result;
    if (this.cb) {
      result = await this.cb(data);
    }

    const replyId = data.replyId;
    if (replyId) {
      this.send({ reply: result, replyToId: replyId });
    }
  }

  async send(data, replyCb) {
    const msgId = 'msg_' +(new ShortUniqueId({
      length: 10,
      dictionary: 'alphanum_lower',
    })).rnd();

    data.msgId = msgId;
    this.sent[msgId] = true;

    if (replyCb) {
      const replyId = 'reply_' +(new ShortUniqueId({
        length: 10,
        dictionary: 'alphanum_lower',
      })).rnd();
      data.replyId = replyId;
      this.replyCb[replyId] = replyCb;
    }

    return this.ws.send(JSON.stringify({
      command: 'relaySend',
      id: this.id,
      data,
    }));
  }

  async close() {
    if (!this.ws) return;

    const ws = this.ws;
    this.ws = null;
    ws.close(1000);
    return new Promise((ok) => ws.onclose = ok);
  }
}
