import { logger } from '../log/logger.js';
import { getWebSocket } from '../util.js';
import ShortUniqueId from 'short-unique-id';

export const Client = class {
  constructor(host, options) {
    this.host = (host || 'ws://127.0.0.1:9090').replace(/^http/, 'ws');
    this.cb = null;
    this.replyCb = {};
    this.sent = {};
    this.reconnect = options?.reconnect;
  }

  isConnected() {
    return !!this.ws;
  }

  async connect(id) {
    logger.info(`Connect relay web socket ${id}`);

    if (this.connectionWaiters) {
      logger.debug(`Connection in progress, adding to waiters ${id}`);
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

    // Set `connectionWaiters` before any async calls
    this.connectionWaiters = [];

    const WebSocket = await getWebSocket();
    logger.info(`Connect to websocket on host ${this.host}`);
    let ws;
    try {
      ws = new WebSocket(this.host);
    } catch(e) {
      logger.error(`Web socket connection error: ${e}`);
      throw e;
    }

    return new Promise((ok, err) => {
      this.connectionWaiters.push(ok);

      ws.onopen = () => {
        this.ws = ws;
        logger.info(`Relay web socket connected ${id}`);
        this.ws.send(JSON.stringify({ command: 'relayListen', id }));

        for (const cb of (this.connectionWaiters || [])) {
          cb(id);
        }
        this.connectionWaiters = null;
      }

      ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        this._receive(data);
      }

      ws.onerror = (e) => {
        logger.error(`Websocket error: ${e.error}`);
        this.connectionWaiters = null;
        err(e);
      }

      ws.onclose = async () => {
        this.ws = null;
        logger.debug(`Websocket closed, should reconnect? ${this.reconnect}`);
        if (this.reconnect) {
          await this._reconnect(10);
        }
      }
    });
  }

  async _reconnect(tries) {
    // Turn off reconnection while we are reconnecting
    this.reconnect = false;

    try {
      for (let i = 0; i < tries; i++) {
        logger.info(`Try to reconnect, attempt ${i}`);

        const result = await new Promise((ok) => {
          setTimeout(
            async () => {
              try {
                await this.connect(this.id);
                ok('ok');
              } catch (e) {
                ok('error');
              }
            },
            Math.min(10000, i * 1000));
        });

        logger.debug(`Reconnect result: ${result}`);

        if (result == 'ok') {
          logger.info(`Reconnected ${this.id}`);
          return;
        }
      }
    } finally {
      logger.debug(`Re-enable reconnect`);
      this.reconnect = true;
    }

    throw new Error('Could not reconnect');
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
      if (!replyCb) {
        logger.warn(`Dropping extra reply to ${data.replyToId}`);
        return;
      }

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

    const payload = JSON.stringify({
      command: 'relaySend',
      id: this.id,
      data,
    });

    logger.debug(`Sending ${msgId} to ${this.id}, size=${payload.length} bytes...`);

    return this.ws.send(payload);
  }

  async close() {
    if (!this.ws) return;

    this.reconnect = false;
    const ws = this.ws;
    this.ws = null;
    logger.debug(`Send close to websocket`);
    ws.close(1000);
    return new Promise((ok) => ws.onclose = ok);
  }
}
