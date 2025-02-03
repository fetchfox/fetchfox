import pTimeout from 'p-timeout';
import { TagRemovingMinimizer } from "../min/TagRemovingMinimizer.js";
import { logger } from "../log/logger.js";
import { Timer } from "../log/timer.js";
import { getAI } from '../ai/index.js';
import * as prompts from './prompts.js';

export const Instructions = class {
  constructor(url, commands, options) {
    this.url = url;
    this.commands = commands;
    for (const command of this.commands) {
      command.max ??= 100;
      command.repeat ??= 0;
    }
    this.ai = options?.ai || getAI();
    this.loadTimeout = options?.loadTimeout || 15000;
  }

  toString() {
    return `[${this.constructor.name}: ${this.url}]`;
  }

  serialize() {
    return JSON.stringify({ url: this.url, commands: this.commands });
  }

  unshiftCommand(command) {
    this.learned = null;
    this.commands.unshift(command);
  }

  async learn(fetcher) {
    const learned = [];

    const min = new TagRemovingMinimizer(['style', 'script', 'meta', 'link']);

    // TODO: refactor how fetcher works
    const timer = new Timer();
    let ctx = {};
    await fetcher.start(ctx);
    ctx = { ...ctx, ...(await fetcher.goto(this.url, ctx)) };

    for (const command of this.commands) {
      const doc = await fetcher.current(ctx);
      const html = (await min.min(doc, { timer })).html;

      logger.debug(`${this} Learn how to do: ${command}`);

      const context = { html, command: command.prompt };
      const { prompt: actionPrompt } = await prompts.pageAction
        .renderCapped(context, 'html', this.ai);

      const stream = this.ai.stream(actionPrompt, { format: 'jsonl' });
      for await (const { delta } of stream) {
        const action = {
          type: delta.actionType,
          arg: delta.actionArgument,
          yieldBefore: delta.shouldYieldBefore == 'yes',
          max: command.max,
          repeat: command.repeat,
        };
        learned.push(action);
        await fetcher.act(ctx, action, 0);
      }
    }

    // TODO: Check if the learned actions work, and retry if they don't

    this.learned = learned;
    logger.info(`${this} Learned actions: ${JSON.stringify(this.learned, null, 2)}`);

    await fetcher.finish(ctx);
  }

  async *execute(fetcher) {
    logger.info(`${this} Execute instructions: ${this.url} ${this.learned}`);

    // Track gotos (page loads) and actions taken
    const usage = {
      goto: 0,
      actions: new Array(this.learned.length).fill(0),
    };

    // Running fetcher context
    let ctx = {};

    const zero = (action) => {
      return {
        index: 0,
        repeat: action.repeat,
        repetition: 0,
      };
    }

    const incr = (index) => {
      if (++index.repetition >= index.repeat) {
        index.repetition = 0;
        index.index++;
      }
    }

    const goto = async (i, state) => {
      if (i != 0) {
        throw new Error('TODO');
      }
      usage.goto++;
      ctx = { ...ctx, ...(await fetcher.goto(this.url, ctx)) };
    }

    // skip is use for pagination, where we want to use the first page by not
    // taking an action on the first iteration
    const skip = (action, state, i) => {
      return (
        action.yieldBefore &&
        state[i].index == 0 &&
        state[i].repetition == 0
      );
    }

    const state = [];
    for (const action of this.learned) {
      state.push(zero(action));
    }

    await fetcher.start(ctx);
    try {
      await goto(0, state);

      let i = 0;

      while (true) {
        logger.debug(`${this} Execute instructions, iterate i=${i}, state=${state}`);
        console.log(`exec iteration i=${i}`, state);

        const action = this.learned[i];

        if (!action) {
          const doc = await pTimeout(fetcher.current(ctx), { milliseconds: this.loadTimeout });
          yield Promise.resolve({ doc });
          break;
        }

        let success;
        if (state[i].index >= action.max) {
          console.log('hit max');
          console.log(`-> no action i=${i}`);

          logger.debug(`${this} Hit max iterations of action i=${i} action=${action}`);
          success = false;
        } else {
          // TODO: fix this, it must happe only when i == last
          // if (false && action?.yieldBefore && isFirst(state[i])) {
          if (skip(action, state, i)) {
            console.log('skip');
            success = true;
          } else {
            console.log(`===> exec action i=${i}`, state[i].index);
            usage.actions[i]++;
            success = await fetcher.act(ctx, action, state[i].index);
          }
        }

        if (success) {
          const isLast = i == this.learned.length - 1;
          if (isLast) {
            incr(state[i]);
            // TODO: single helper function for current + timeout
            const doc = await pTimeout(fetcher.current(ctx), { milliseconds: this.loadTimeout });
            logger.info(`${this} Executing instructions found: ${doc}`);
            yield Promise.resolve({ doc, usage });
          } else {
            i++;
          }
        }

        if (!success) {
          if (i == 0) {
            // End condition: we failed on the first action
            break;
          } else {
            incr(state[i - 1]);
            for (let j = i; j < this.learned.length; j++) {
              state[j] = zero(this.learned[j]);
            }
            i = 0;
            // await goto(0, state);

            console.log('');
            console.log('== RESTORE STATE ==');
            console.log('');

            console.log(JSON.stringify(state, null, 2));

            // goto original url
            usage.goto++;
            ctx = { ...ctx, ...(await fetcher.goto(this.url, ctx)) };

            let doc;
            doc = await pTimeout(fetcher.current(ctx), { milliseconds: this.loadTimeout });
            console.log('html BEFORE restore state:', doc.html);

            // do repeat actions to restore state
            for (let j = 0; j < state.length; j++) {
              const index = state[j];
              const action = this.learned[j];
              for (let k = 0; k < index.repetition; k++) {
                console.log('exec action:', action);
                if (action.yieldBefore && k == 0) {
                  // skip
                } else {
                  usage.actions[j]++;
                  await fetcher.act(ctx, action, index.index);
                }
              }
            }

            doc = await pTimeout(fetcher.current(ctx), { milliseconds: this.loadTimeout });
            console.log('html AFTER restore state:', doc.html);

            // throw 'STOP';
          }
        }
      }
    } finally {
      await fetcher.finish(ctx);
    }

    yield Promise.resolve({ usage });
  }

}


// TODO: loop in domain specific instructions for pagination
      // const targetUrl = new URL(url).href;
      // let domainSpecific = [
      //   {
      //     prefix: /^https:\/\/([a-zA-Z0-9-]+\.)?x\.com/, instruction: 'You are on x.com, which paginates by scrolling down exactly one window length. Your pagination should do this.'
      //   },
      //   {
      //     prefix: /^https:\/\/([a-zA-Z0-9-]+\.)?producthunt\.com/, instruction: `You are on ProductHunt, which paginates using a button with the text "See all of today's products" in it`
      //   },
      //   {
      //     prefix: /^https:\/\/([a-zA-Z0-9-]+\.)?google\.com\/maps/, instruction: 'You are on Google Maps, which paginates by bringing the results list into focus by clicking on it and then scrolling down one window length.'
      //   },
      // ]
      // const match = domainSpecific.find(({ prefix }) => prefix.test(targetUrl));
      // if (match) {
      //   domainSpecific = '>>>> Follow this important domain specific guidance:\n\n' + match.instruction;
      //   logger.debug(`${this} adding domain specific prompt: ${domainSpecific}`);
      // } else {
      //   domainSpecific = '';
      // }
