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
    await instr.learn(cursor.ctx.fetcher);

    logger.debug(`${this} Proceeding with learned actions: ${JSON.stringify(instr.learned, null, 2)}`);

    const gen = instr.execute(cursor.ctx.fetcher);
    for await (const { doc } of gen) {
      if (!doc) {
        logger.warn(`${this} Got null doc for ${instr}`);
        continue;
      }
      const done = cb(doc);
      if (done) break;
    }
  }
}
