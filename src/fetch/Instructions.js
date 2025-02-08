import pTimeout from 'p-timeout';
import { logger } from "../log/logger.js";
import { getAI } from '../ai/index.js';
import { shortObjHash } from '../util.js';
import * as prompts from './prompts.js';

export const Instructions = class {
  constructor(url, commands, options) {
    this.url = url;
    this.commands = [];
    for (const command of commands) {
      let c;
      if (typeof command == 'string') {
        c = { prompt: command };
      } else {
        c = command;
      }
      this.commands.push(c);
    }
    this.cache = options?.cache;
    this.ai = options?.ai || getAI();
    this.loadTimeout = options?.loadTimeout || 15000;
    this.limit = options?.limit || 20;
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  serialize() {
    return JSON.stringify({ url: this.url, commands: this.commands });
  }

  unshiftCommand(command) {
    this.learned = null;
    this.commands.unshift(command);
  }

  cacheKey() {
    const hash = shortObjHash({
      url: this.url,
      commands: this.commands.map(it => it.prompt),
    });
    return `instructions-${hash}`;
  }

  async learn(fetcher, ctx) {
    const learned = [];

    const key = this.cacheKey();
    if (this.cache) {
      const cached = await this.cache.get(key);
      if (cached) {
        logger.debug(`${this} Cache hit for ${key}`);
        this.learned = cached;
        return;
      } else {
        logger.debug(`${this} Cache miss for ${key}`);
      }
    }

    try {
      // ctx = { ...ctx, ...(await fetcher.goto(this.url, ctx)) };
      // console.log('goto with ctx:', ctx);
      // logger.trace('???');
      await fetcher.goto(this.url, ctx);

      // TODO: It would be nice of learning supported caching. Right now,
      // we use the live page for interactions, but it should be possible to
      // cache a chain of url + commands
      for (const command of this.commands) {
        const doc = await fetcher.current(ctx);
        if (!doc) {
          throw new Error(`${this} Couldn't get document to learn commands ${this.url}`);
        }

        logger.debug(`${this} Learn how to do: ${command.prompt}`);

        const html = doc.html;
        const context = { html, command: command.prompt };

        if (command.prompt == '{{nextPage}}') {
          command.mode = 'repeat';
        }

        console.log('command.prompt:', command);
        console.log('command.prompt:', command.prompt);

        const actionPrompts = await prompts.pageAction
          .renderMulti(context, 'html', this.ai);

        for (const actionPrompt of actionPrompts) {
          const stream = this.ai.stream(actionPrompt, { format: 'jsonl' });
          let ok = true
          const incr = [];

          for await (const { delta } of stream) {
            logger.debug(`${this} Received action: ${JSON.stringify(delta)}`);

            if (delta.actionType == 'none') {
              logger.debug(`${this} Ignoring "none" action`);
              ok = false;
              continue;
            }

            const action = {
              type: delta.actionType,
              arg: delta.actionArgument,
              mode: command.mode,

              // optional: !!command.optional,
              // alwaysFirst: command.alwaysFirst,
              // repeat: command.repeat,
            };

            console.log('action:', action);

            const r = await fetcher.act(ctx, action, {});
            ok &&= r.ok;

            if (r.ok) {
              incr.push(action);
            }
          }

          // // heuristics....clean this up....
          // for (let i = 0 ; i < incr.length - 1; i++) {
          //   incr[i].alwaysFirst = true;
          // }
          // if (incr.length && command.repeat) {
          //   incr[incr.length - 1].repeat = command.repeat;
          // }
          // // end heuristics.....

          learned.push(...incr);

          if (ok) {
            break;
          }
        }
      }

      // TODO: Check if the learned actions work, and retry if they don't

      console.log('learned', learned);

      this.learned = learned;

      if (this.cache) {
        logger.debug(`${this} Setting cache for ${key}`);
        await this.cache.set(key, this.learned);
      }

      logger.info(`${this} Learned actions: ${JSON.stringify(this.learned, null, 2)}`);
    } finally {
      await fetcher.finishGoto(ctx);
    }
  }

  async *execute(fetcher, ctx) {
    if (this.commands?.length && !this.learned?.length) {
      throw new Error('must learn before execute');
    }

    logger.info(`${this} Execute instructions: url=${this.url} learned=${JSON.stringify(this.learned)}`);

    // Track gotos (page loads) and actions taken
    const usage = {
      goto: 0,
      actions: new Array(this.learned.length).fill(0),
    };

    const zero = (action) => {
      return {
        index: 0,
        repetition: 0,
        action,

        // repeat: action.repeat,
        // alwaysFirst: action.alwaysFirst,
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

      if (copy[i].action.mode == 'repeat') {
        copy[i].repetition++;
      }

      // if (copy[i].action.alwaysFirst) {
      //   // No-op, these always execute
      // } if (copy[i].action.repeat) {
      //   copy[i].repetition++;
      // } else {
      //   copy[i].index++;
      // }

      return copy;
    }

    const seen = {};

    const act = async (i, state) => {
      // const action = this.learned[i];
      const action = state[i].action;

      // TODO: add and check state.limit

      // if (state[i].action.repeat && state[i].repetition >= state[i].action.repeat) {
      //   logger.debug(`${this} Max repetitions on ${JSON.stringify(state)}`);
      //   return false;
      // }

      const index = state[i].index;
      // if (index >= state[i].max) {
      //   logger.debug(`${this} Max index on ${JSON.stringify(state)}`);
      //   return false;
      // }

      let ok = true;
      let outcome;

      switch (action.mode) {
        case 'repeat':
          // First iteration of repeat doesn't excute, so it is always ok;
          outcome = { ok: true };

          // Repeat actions do not use seen and execute a certain number of times
          for (let r = 0; r < state[i].repetition; r++) {
            outcome = await fetcher.act(ctx, action, {});
          }
          break;

        case 'first':
          outcome = await fetcher.act(ctx, action, {});
          break;

        case 'distinct':
          outcome = await fetcher.act(ctx, action, seen);
          seen[outcome.html] = true;
          break;
      }

      // if (action.repeat) {
      // } else if (action.alwaysFirst) {
      //   // Always first actions do not use seen, are always executed on the first match
      // } else {
      // }

      ok &&= outcome?.ok || action.optional;
      usage.actions[i]++;

      return ok;
    }

    const goto = async () => {
      usage.goto++;
      await fetcher.goto(this.url, ctx);
    }

    const current = async () => {
      console.log('current...');
      const doc = await pTimeout(fetcher.current(ctx), { milliseconds: this.loadTimeout });
      console.log('current got doc: ' + doc);

      logger.debug(`${this} Got document: ${doc}`);
      return doc;
    }

    await fetcher.start(ctx);

    try {

      if (!this.learned || this.learned.length == 0) {
        logger.debug(`${this} No actions, just a simple URL goto`);
        await goto();
        const doc = await current();
        yield Promise.resolve({ doc });
        return;
      }

      let state = zeroState();

      console.log('zero state:', state);

      let count = 0;

      while (true) {
        console.log('count & limit:', count, this.limit);
        if (count++ >= this.limit) {
          console.log('count over limit, break');
          break;
        }

        console.log('');
        console.log('');
        console.log('');
        console.log('==================');
        console.log('goto');
        await goto();
        console.log('current');
        await current();  // Don't use doc, but this is needed to check load conditions

        let j;
        let ok;
        for (j = 0; j < state.length; j++) {
          console.log('j=', j);
          ok = await act(j, state);

          console.log('act ok?? -->', ok);

          logger.debug(`${this} Execute iteration ${j} ok=${ok} state=${JSON.stringify(state)}`);
          if (!ok) {
            for (let k = j; k < this.learned.length; k++) {
              state[k] = zero(this.learned[k]);
            }
            j++;
            break;
          }
        }

        j--;

        if (!ok) {
          console.log('!ok, check upstream');
          const upstream = this.learned.slice(0, j).filter(it => !it.optional);
          if (upstream.length == 0) {
            console.log('upstream==0, break');
            logger.debug(`${this} Got not ok and all upstream are optional, done`);
            break;
          }
        }

        if (!ok) {
          console.log('j--');
          j--;
        }

        state = incrState(j, state);

        console.log('state after:', state);
        // throw 'stop44';

        logger.debug(`${this} State after incrementing: ${JSON.stringify(state)}`);

        if (ok) {
          console.log('ok, current yield');
          const doc = await current();
          logger.debug(`${this} Yielding a document: ${doc}`);
          yield Promise.resolve({ doc, usage });
        }
      }

    } finally {
      await fetcher.finishGoto(ctx);
    }

    yield Promise.resolve({ usage });
  }
}
