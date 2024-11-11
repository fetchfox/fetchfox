import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';
import { Actor } from '../act/Actor.js';
import { Item } from '../item/Item.js';

export const ActionStep = class extends BaseStep {
  constructor(args) {
    super(args);

    // TODO: args
    this.action = args.action;
    this.query = args.query;
    this.selector = args.selector;
  }

  async process({ cursor, item }, cb) {
    const url = item.url;

    let base = item.actor() || cursor.ctx.actor;
    actor = base.fork();

    while (true) {
      let [fork, done] = await actor.fork(this.action, this.query, this.selector);
      const doc = await fork.doc();
      const output = new Item(item, doc);
      output.setActor(fork);
      done = done || cb(output);
      if (done) break;
    }
  }
}
