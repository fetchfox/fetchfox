import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';
import { Instructions } from '../fetch/index.js';

export const ActionStep = class extends BaseStep {
  constructor(args) {
    // TODO: fetcher pool system for pw concurrency
    super({ ...args, concurrency: 8 });
    this.commands = args.commands;
  }

  async process({ cursor, item }, cb) {
    const url = item.url || item._url;
    const instr = new Instructions(url, this.commands, cursor.ctx);

    // TODO: refactor how fetcher works to eliminate ctx concept
    const fetcherCtx = {};
    await cursor.ctx.fetcher.start(fetcherCtx);
    try {
      const gen = cursor.ctx.fetcher.fetch(instr);
      for await (const doc of gen) {
        if (!doc) {
          logger.warn(`${this} Got null doc for ${instr}`);
          continue;
        }
        const done = cb(doc);
        if (done) break;
      }
    } finally {
      await cursor.ctx.fetcher.finish(fetcherCtx);
    }
  }
}
