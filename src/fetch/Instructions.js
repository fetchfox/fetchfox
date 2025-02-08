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
    this.limit = options?.limit;
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
            };

            const r = await fetcher.act(ctx, action, {});
            ok &&= r.ok;

            if (r.ok) {
              incr.push(action);
            }
          }

          learned.push(...incr);

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

    const zero = (action) => ({ repetition: 0, action });
    const zeroState = () => this.learned.map(action => zero(action));

    const incrState = (i, state) => {
      const copy = JSON.parse(JSON.stringify(state));

      if (copy[i].action.mode == 'repeat') {
        copy[i].repetition++;
      }

      return copy;
    }

    const seen = {};

    const act = async (i, state) => {
      const action = state[i].action;

      let ok = true;
      let outcome;

      switch (action.mode) {
        case 'repeat':
          // `repeat` mode exeutes an action multiple times on the same element.
          // It first exeutes it 0 times, then 1 times, then 2 times, etc.
          outcome = { ok: true };
          for (let r = 0; r < state[i].repetition; r++) {
            outcome = await fetcher.act(ctx, action, {});
          }
          break;

        case 'first':
          // `first` mode always executes the action on the same element
          outcome = await fetcher.act(ctx, action, {});
          break;

        case 'distinct':
          // `distinct` mode always executes the action on distinct elements,
          // based on unique html.
          outcome = await fetcher.act(ctx, action, seen);
          seen[outcome.html] = true;
          break;
      }

      ok &&= outcome?.ok || action.optional;
      usage.actions[i]++;

      return ok;
    }

    const goto = async () => {
      usage.goto++;
      await fetcher.goto(this.url, ctx);
    }

    const current = async () => {
      const doc = await pTimeout(fetcher.current(ctx), { milliseconds: this.loadTimeout });
      logger.debug(`${this} Got document: ${doc}`);
      return doc;
    }

    try {
      if (!this.learned || this.learned.length == 0) {
        logger.debug(`${this} No actions, just a simple URL goto`);
        await goto();
        const doc = await current();
        yield Promise.resolve({ doc });
        return;
      }

      let state = zeroState();
      let count = 0;

      while (true) {
        if (count++ >= this.limit) {
          break;
        }

        await goto();
        await current();  // Don't use doc, but this is needed to check load conditions

        let i;
        let ok;
        for (i = 0; i < state.length; i++) {
          ok = await act(i, state);
          logger.debug(`${this} Execute iteration ${i} ok=${ok} state=${JSON.stringify(state)}`);

          if (!ok) {
            for (let j = i; j < this.learned.length; j++) {
              state[j] = zero(this.learned[j]);
            }
            i++;
            break;
          }
        }

        i--;

        if (!ok) {
          const upstream = this.learned.slice(0, i).filter(it => !it.optional);
          if (upstream.length == 0) {
            logger.debug(`${this} Got not ok and all upstream are optional, done`);
            break;
          }
        }

        if (!ok) {
          i--;
        }

        state = incrState(i, state);

        logger.debug(`${this} State after incrementing: ${JSON.stringify(state)}`);

        if (ok) {
          const doc = await current();
          logger.debug(`${this} Yielding a document: ${doc}`);
          yield Promise.resolve({ doc, usage });
        }
      }

    } finally {
      console.log('finish goto');
      await fetcher.finishGoto(ctx);
    }

    yield Promise.resolve({ usage });
  }
}
