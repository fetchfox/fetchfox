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
      logger.debug(`Relay fetcher sending message expecting reply for ${url}`);

      const reply = await new Promise((ok) => {
        this.client.send(
          { command: 'fetch', url },
          ok
        )});

      logger.debug(`Relay fetcher got reply: ${Object.keys(reply).join(', ')}`);
      logger.info(`Relay fetcher response: "${(reply?.html || '').substr(0, 140).replace(/[\n\t ]+/g, ' ')} for ${url}`);

      const doc = new Document();
      doc.loadData(reply);

      logger.debug(`Relay fetcher loaded document: ${doc}`);

      return doc;
    } finally {
      this._inFlight--;

      if (this._inFlight == 0) {
        await this.cleanup();
      }
    }
  }

  async cleanup() {
    return this.client.close();
  }
}
