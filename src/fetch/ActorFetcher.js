import fetch from 'node-fetch';
import playwright from 'playwright';
import { logger } from '../log/logger.js';
import { Document } from '../document/Document.js';
import { BaseFetcher } from './BaseFetcher.js';

export const ActorFetcher = class extends BaseFetcher {
  constructor(options) {
    super(options);
  }

  async *_fetch(url, options) {
    logger.info(`Actor fetch ${url} with ${options.actor}`);
    const actor = options.actor;

    await actor.goto(url, true);

    const docs = [];
    let i = 0;
    const gen = actor.scrollForDocs(options?.scroll || 1, options?.scrollWait);
    for await (const doc of gen) {
      yield Promise.resolve(doc);
    }

    // for await (const doc of gen) {
    //   await doc.writeHtml(`/Users/marcell/Desktop/out${i}.html`);
    //   i++;
    //   // docs.push(doc);
    //   yield doc;
    // }
    // return docs;
  }
}

