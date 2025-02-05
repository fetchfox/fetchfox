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

  async learn(fetcher) {
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

    // TODO: refactor how fetcher works
    let ctx = {};
    await fetcher.start(ctx);
    try {
      ctx = { ...ctx, ...(await fetcher.goto(this.url, ctx)) };

      // TODO: It would be nice of learning supported caching. Right now,
      // we use the live page for interactions, but it should be possible to
      // cache a chain of url + commands
      for (const command of this.commands) {
        const doc = await fetcher.current(ctx);
        if (!doc) {
          throw new Error(`${this} Couldn't get document to learn commands ${this.url}`);
        }

        const html = doc.html;

        logger.debug(`${this} Learn how to do: ${command.prompt}`);

        const context = { html, command: command.prompt };

        // const { prompt: actionPrompt } = await prompts.pageAction
        //   .renderCapped(context, 'html', this.ai);
        // const actionPrompts = 

        // this.ai.maxTokens = 40000;
        const actionPrompts = await prompts.pageAction
          .renderMulti(context, 'html', this.ai);

        for (const actionPrompt of actionPrompts) {
          const stream = this.ai.stream(actionPrompt, { format: 'jsonl' });
          let ok = true
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
              max: command.max,
              repeat: command.repeat,
              optional: command.optional,
            };

            console.log('---> command:', command);
            console.log('---> action: ', action);

            if (delta.isPaginationAction == 'yes') {
              action.repeat ??= 5;

              // TODO: If pagination is the *only* action, we should yield a single
              // document here to get things started in downstream steps
            }

            action.repeat ??= 0;
            action.max ??= 100;

            const r = await fetcher.act(ctx, action, {});
            ok &&= r.ok;
            console.log('ok??', ok);
            if (r.ok) {
              learned.push(action);
            }
          }
          console.log('ok ->', ok);
          if (ok) {
            break;
          }
        }
      }

      // TODO: Check if the learned actions work, and retry if they don't

      this.learned = learned;

      if (this.cache) {
        logger.debug(`${this} Setting cache for ${key}`);
        await this.cache.set(key, this.learned);
      }

      logger.info(`${this} Learned actions: ${JSON.stringify(this.learned, null, 2)}`);
    } finally {
      await fetcher.finish(ctx);
    }
  }

  async *execute(fetcher) {
    if (this.commands?.length && !this.learned?.length) {
      throw new Error('must learn before execute');
    }

    logger.info(`${this} Execute instructions: url=${this.url} learned=${this.learned}`);

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
        repetition: 0,
        max: action.max,
        repeat: action.repeat,
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

    const seen = {};

    const act = async (i, state) => {
      const action = this.learned[i];

      if (state[i].repeat && state[i].repetition >= state[i].repeat) {
        logger.debug(`${this} Max repetitions on ${JSON.stringify(state)}`);
        return false;
      }

      const index = state[i].index;
      if (index >= state[i].max) {
        logger.debug(`${this} Max index on ${JSON.stringify(state)}`);
        return false;
      }

      console.log('');
      console.log('\t!! do action:', action);
      console.log('');

      let ok = true; 
      if (state[i].repeat) {
        console.log('');
        console.log('\t>> state[i]:', state[i]);
        console.log('');

        for (let r = 0; r < state[i].repetition; r++) {
          // Repeat actions do not use seen
          const result = await fetcher.act(ctx, action, {});
          ok &&= result.ok;
          usage.actions[i]++;
        }
      } else {
        const result = await fetcher.act(ctx, action, seen);
        ok &&= result.ok;

        // For now, only track seen html
        seen[result.html] = true;

        usage.actions[i]++;
      }

      return ok;
    }

    const goto = async () => {
      usage.goto++;
      ctx = { ...ctx, ...(await fetcher.goto(this.url, ctx)) };
    }

    const current = async () => {
      const doc = await pTimeout(fetcher.current(ctx), { milliseconds: this.loadTimeout });
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

      while (true) {
        await goto();
        await current();  // Don't use doc, but this is needed to check load conditions

        let j;
        let ok;
        for (j = 0; j < state.length; j++) {
          ok = await act(j, state);
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

        if (!ok && j == 0) {
          logger.debug(`${this} First step not ok, done`);
          break;
        }

        if (!ok) {
          j--;
        }

        state = incrState(j, state);
        logger.debug(`${this} State after incrementing: ${JSON.stringify(state)}`);

        if (ok) {
          const doc = await current();
          logger.debug(`${this} Yielding a document: ${doc}`);
          yield Promise.resolve({ doc, usage });
        }

        fetcher.finishGoto(ctx)
          .catch((e) => {
            logger.warn(`${this} Ignoring finish goto error: ${e}`);
          });
      }

    } finally {
      await fetcher.finish(ctx);
    }

    yield Promise.resolve({ usage });
  }
}
