import { logger } from '../log/logger.js';
import { BaseStep } from './BaseStep.js';

export const ActionStep = class extends BaseStep {
  static info = BaseStep.combineInfo({
    name: 'action',
    description: 'Perform some action on the page, such as clicking buttons',
    args: {
      actions: {
        description: `A list of actions to take on the page. Each action is an array of three items. The first item is the action to take, eg. 'click'. The second item is a description of the target of this action, eg. 'all the download buttons on the page. The third item is an optional CSS selector, to narrow the range of elements searched.'`,
        format: 'array',
        example: ['click', 'the next page button', 'button.cta'],
        required: true,
      },
    },
  });

  constructor(args) {
    super(args);
    console.log('!! ARGS', args);
    this.actions = args.actions || [];
  }

  async process({ cursor, item }, cb) {
    logger.verbose(`Action step for ${item}`);
    console.log('Act! ' + item);
    console.log(cursor.ctx.actor);
    console.log(this.args());

    const actor = cursor.ctx.actor;
    await actor.act(item.url, this.actions);

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
