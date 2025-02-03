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

    const zeroState = () => {
      const state = [];
      for (const action of this.learned) {
        state.push(zero(action));
      }
      return state;
    }

    const incr = (index) => {
      if (++index.repetition >= index.repeat) {
        index.repetition = 0;
        index.index++;
      }
    }

    const incrState = (i, state) => {
      console.log('incr state', i, state);
      const copy = JSON.parse(JSON.stringify(state));
      console.log('copy ', copy);

      if (copy[i].repeat) {
        copy[i].repetition++;

      } else {
        copy[i].index++;
      }

      return copy;
    }

    const advanceToState = async (state, targetState) => {

      let ok = true;

      for (let i = 0; i < state.length; i++) {
        const st = state[i];
        const targetSt = targetState[i];
        const action = this.learned[i];

        if (st.repeat) {
          for (let j = st.repetition; j < targetSt.repetition; j++) {
            console.log('advance: exec action (r)', action.arg);

            // check that we are under the max times to repeat
            ok &&= j < st.repeat;

            if (j == 0 && action.yieldBefore) {
              console.log('-> yield before');
            } else {
              // if yes, check that we successfully execute this action
              ok &&= await fetcher.act(ctx, action, st.index);
            }
          }
        } else if (st.index != targetSt.index) {
          console.log('advance: exec last & leaf action (x)', action.arg);

          // TODO: check `st.max` here

          // Execute on index - 1.
          // Subtract 1 because advanceToState is called after incrementing
          // the state, so the index is exactly 1 more than what we need to
          // interact with.
          ok &&= await fetcher.act(ctx, action, targetSt.index - 1);
        }
      }

      return ok;
    }

    const goto = async () => {
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

    let state = zeroState();

    await fetcher.start(ctx);
    try {
      await goto();

      let i = 0;

      while (true) {
        let targetState;
        targetState = incrState(i, state);
        const ok = await advanceToState(state, targetState);
        const isLast = i == this.learned.length - 1;

        if (ok) {
          if (isLast) {
            console.log('ok & last --> yield');
            const doc = await pTimeout(fetcher.current(ctx), { milliseconds: this.loadTimeout });
            yield Promise.resolve({ doc });
          } else {
            console.log('ok & !last --> i++');
            i++;
          }
        } else {
          if (i == 0) {
            throw 'done';
          }
          console.log('!ok --> backtrack + incr');

          // increment prev level
          targetState = incrState(i - 1, targetState);

          // zero out this and downstream levels
          for (let j = i; j < this.learned.length; j++) {
            targetState[j] = zero(this.learned[j]);
          }

          // go back to start
          i = 0;
          await goto();
          console.log('=================');
          await advanceToState(zeroState(), targetState);
          console.log('=================');

          // deboug output
          const doc = await pTimeout(fetcher.current(ctx), { milliseconds: this.loadTimeout });
          console.log('html after backtrack:');
          console.log(doc.html);
          console.log('i=', i);

          console.log(JSON.stringify(targetState, null, 2));

        }

        state = targetState;
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
