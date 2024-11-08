import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';
import { Actor } from '../act/Actor.js';
import { Item } from '../item/Item.js';

export const LoginStep = class extends BaseStep {
  constructor(args) {
    super(args);
    this.username = args.username;
    this.password = args.password;
  }

  async process({ cursor, item }, cb) {
    const url = item.url;

    const actor = await cursor.ctx.actor.fork();
    await actor.start(url);
    await actor.login(this.username, this.password);

    cb({ ...item, actor });
  }
}
