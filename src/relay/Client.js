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
    logger.info(`Connect relay web socket ${id}`);

    if (this.connectionWaiters) {
      logger.debug(`Connection in progres, adding to waiters ${id}`);
      return new Promise((ok) => {
        this.connectionWaiters.push(ok);
      });
    }

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
    const ws = new WebSocket(this.host);

    this.connectionWaiters = [];

    return new Promise((ok, err) => {

      this.connectionWaiters.push(ok);

      ws.onopen = () => {
        this.ws = ws;
        logger.info(`Relay web socket connected ${id}`);
        this.ws.send(JSON.stringify({ command: 'relayListen', id }));

        for (const cb of this.connectionWaiters) {
          cb(id);
        }

        this.connectionWaiters = null;
      }

      ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        this._receive(data);
      }

      ws.onerror = (e) => {
        err(e);
      }

      ws.onclose = () => {
        logger.info(`Websocket closed`);
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
      logger.debug(`Sending reply to ID: ${replyId}`);
      await this.send({ reply: result, replyToId: replyId });
    }
  }

  async send(data, replyCb) {
    logger.debug(`Relay client send to id=${this.id} host=${this.host} ws=${this.ws}`);

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
      logger.debug(`Added reply ID: ${replyId}`);
    }

    logger.debug(`Sending to ${this.id}...`);

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
    logger.debug(`Send close to websocket`);
    ws.close(1000);
    return new Promise((ok) => ws.onclose = ok);
  }
}
