import fetch from 'node-fetch';
import { logger } from '../log/logger.js';
import { Document } from '../document/Document.js';
import { Client } from '../relay/Client.js';
import { BaseFetcher } from './BaseFetcher.js';

export const RelayFetcher = class extends BaseFetcher {
  constructor(options) {
    super(options);
    this.client = new Client(options?.host);
    this.relayId = options?.relayId;

    this._inFlight = 0;
  }

  async _maybeInit() {
    if (this.client.isConnected()) return;
    logger.info(`Connecting to relay ${this.relayId} on ${this.client.host}`);
    return this.client.connect(this.relayId);
  }

  async _fetch(url, options) {
    await this._maybeInit();

    this._inFlight++;

    try {
      logger.trace(`Relay fetcher sending message expecting reply for ${url}, inflight: ${this._inFlight}`);

      logger.debug(`Expecting reply for ${url}`);

      let timeout;

      const reply = await Promise.race([
        new Promise((ok) => {
          timeout = setTimeout(
            () => {
              logger.error(`Timeout waiting for reply for ${url}`);
              ok();
            },
            15 * 1000);
        }),

        new Promise((ok) => {
          this.client.send(
            { command: 'fetch', url },
            (r) => {
              logger.debug(`Got reply for ${url}`);
              ok(r);
            }
          )}),
      ]);

      clearTimeout(timeout);

      if (!reply) {
        return;
      }

      logger.debug(`Relay fetcher got reply: ${Object.keys(reply).join(', ')}`);
      logger.info(`Relay fetcher response: "${(reply?.html || '').substr(0, 140).replace(/[\n\t ]+/g, ' ')} for ${url}`);

      const doc = new Document();
      doc.loadData(reply);

      logger.debug(`Relay fetcher loaded document for ${url}: ${doc}`);

      return doc;
    } finally {
      this._inFlight--;
      logger.debug(`Still inflight: ${this._inFlight}`);
      if (this._inFlight == 0) {
        logger.info(`Closing relay, in flight: ${this._inFlight}`);
        await this.client.close();
      }
    }
  }
}
