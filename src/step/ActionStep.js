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

    // this.actions = args.actions || [];
  }

  async process({ cursor, item }, cb) {

    console.log('');
    console.log('');
    console.log('   => Running Action', this.action, this.query, item.actor());
    console.log('');
    console.log('');

    logger.verbose(`Action step for ${item}`);
    console.log('Act! ' + item);
    let actor = item.actor();
    if (actor) {
      console.log('actor history:', actor.history);
    } else {
      actor = new Actor(cursor.ctx);
      const url = item?.url || item.source().url;
      await actor.start(url);
    }

    // console.log('got actor: ' + actor);

    let done = false;
    while (!done) {
      const clone = await actor.clone();
      done = await clone.act(this.action, this.query, this.selector);
      const doc = await actor.doc();
      const output = new Item(item, doc);
      output.setActor(clone);

      // console.log('Output has actor:', output.actor());
      done = done || cb(output);
      console.log('===DONE?', done);
      await new Promise(ok => setTimeout(ok, 2000));
      // throw 'STOP';
    }

    // // let done = false
    // let index = 0;
    // while (!done) {
    //   await actor.act(this.action, this.query, this.selector, index++);
    //   const doc = await actor.doc();
    //   console.log('actor doc: ' + doc);
    //   const output = new Item(item, doc);
    //   output.setActor();
    //   await new Promise(ok => setTimeout(ok, 4000));
    // }

    // return done;

    // const actor = cursor.ctx.actor;
    // await actor.act(item.url, this.actions);

    // try {
    //   // for (const [action, query, selector] of this.actions) {
    //   //   console.log('-->', action, 'query:', query, 'selector:', selector);
    //   //   await actor.act(action, query, selector);
    //   //   throw 'xyz';
    //   // }
    // } finally {
    //   await actor.finish();
    // }
  }
}
