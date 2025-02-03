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

    const incrState = (i, state) => {
      const copy = JSON.parse(JSON.stringify(state));

      if (copy[i].repeat) {
        copy[i].repetition++;
      } else {
        copy[i].index++;
      }

      return copy;
    }

    const act = (i, index) => {
      usage.actions[i]++;
      return fetcher.act(ctx, this.learned[i], index);
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
            ok &&= await act(i, st.index);
          }
        } else if (st.index != targetSt.index) {
          console.log('advance: exec last & leaf action (x)', action.arg);

          // Execute on index - 1.
          // The -1 is because advanceToState is called after incrementing
          // the state, so the index is exactly 1 more than what we need to
          // interact with.
          ok &&= await act(i, targetSt.index - 1);
        }
      }

      return ok;
    }

    const goto = async () => {
      usage.goto++;
      ctx = { ...ctx, ...(await fetcher.goto(this.url, ctx)) };
    }

    const done = (state) => {
      if (state[0].repeat && state[0].repetition > state[0].repeat) {
        throw new Error('unexpected state');
      }
      if (state[0].repeat && state[0].repetition == state[0].repeat) {
        return true;
      }
      if (state[0].index > state[0].max) {
        throw new Error('unexpected state');
      }
      if (state[0].index == state[0].max) {
        return true;
      }

      return false;
    }

    let state = zeroState();

    await fetcher.start(ctx);

    try {
      await goto();

      let i = 0;
      let targetState = JSON.parse(JSON.stringify(state));

      while (true) {
        if (done(targetState)) {
          break;
        }

        const ok = await advanceToState(state, targetState);
        state = targetState;
        const isLast = i == this.learned.length - 1;

        if (ok) {
          if (isLast) {
            const doc = await pTimeout(fetcher.current(ctx), { milliseconds: this.loadTimeout });
            yield Promise.resolve({ doc });
          } else {
            i++;
          }

          // Update the target state for next time
          targetState = incrState(i, targetState);

        } else {
          if (i == 0) {
            break; // first level failed, all done
          }

          // Increment prev level
          targetState = incrState(i - 1, targetState);

          // Zero out this and downstream levels
          for (let j = i; j < this.learned.length; j++) {
            targetState[j] = zero(this.learned[j]);
          }

          // Go back to start and restore the state from there
          i = 0;
          await goto();
          state = zeroState();
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
