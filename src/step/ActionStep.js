import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';
import { Actor } from '../act/Actor.js';
import { Item } from '../item/Item.js';

export const ActionStep = class extends BaseStep {
  static info = BaseStep.combineInfo({
    name: 'action',
    description: 'Perform some action on the page, such as clicking buttons',
    args: {
      action: {},
      query: {},
      selector: {},

      // actions: {
      //   description: `A list of actions to take on the page. Each action is an array of three items. The first item is the action to take, eg. 'click'. The second item is a description of the target of this action, eg. 'all the download buttons on the page. The third item is an optional CSS selector, to narrow the range of elements searched.'`,
      //   format: 'array',
      //   example: ['click', 'the next page button', 'button.cta'],
      //   required: true,
      // },
    },
  });

  constructor(args) {
    super(args);

    // TODO: args
    this.action = args.action;
    this.query = args.query;
    this.selector = args.selector;
  }

  async process({ cursor, item }, cb) {
    const url = item.url;

    let actor;
    let base = item.actor();
    if (base) {
      actor = base.fork();
    } else {
      actor = new Actor(cursor.ctx);
      await actor.start(url);
    }

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
