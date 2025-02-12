import pTimeout from 'p-timeout';
import { logger } from "../log/logger.js";
import { getAI } from '../ai/index.js';
import { shortObjHash } from '../util.js';
import * as prompts from './prompts.js';

// TODO:
// - If pagination is the only action, don't restart from the beginning.
// - More generally, this applies if there is only a single `repeat` action
// - Detect and use changes in URL as a shortcut

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

    const ctx = {};

    try {
      await fetcher.start(ctx);
      await fetcher.goto(this.url, ctx);

      // TODO: It would be nice of learning supported caching. Right now,
      // we use the live page for interactions, but it should be possible to
      // cache a chain of url + commands
      for (const command of this.commands) {
        const doc = await this.current(fetcher, ctx);
        if (!doc) {
          throw new Error(`${this} Couldn't get document to learn commands ${this.url}`);
        }

        logger.debug(`${this} Learn how to do: ${command.prompt}`);

        if (command.prompt == '{{nextPage}}') {
          command.prompt = 'Go to the next page.';
          const domainSpecific = domainSpecificInstructions(this.url);
          if (domainSpecific) {
            command.prompt += domainSpecific;
          }
          logger.debug(`${this} Expanded prompt: ${command.prompt}`);
          command.mode = 'repeat';
          command.pagination = true;
        }

        const context = {
          html: doc.html,
          command: command.prompt,
        };

        const actionPrompts = await prompts.pageAction
          .renderMulti(context, 'html', this.ai);

        for (const actionPrompt of actionPrompts) {
          const answer = await this.ai.ask(actionPrompt, { format: 'jsonl' });
          const incr = [];
          for (const delta of answer.partial.result) {
            logger.debug(`${this} Received action: ${JSON.stringify(delta)}`);

            if (delta.actionType == 'none') {
              logger.debug(`${this} Ignoring "none" action`);
              ok = false;
              continue;
            }

            const action = {
              type: delta.actionType,
              arg: delta.actionArgument,
              mode: 'first',
            };
            incr.push(action);

            await fetcher.act(ctx, action, {});
          }

          incr[incr.length - 1].mode = command.mode;
          incr[incr.length - 1].limit = command.limit;
          learned.push(...incr);
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

    logger.info(`${this} Execute instructions: url=${this.url} learned=${JSON.stringify(this.learned)}`);

    // Track gotos (page loads) and actions taken
    const usage = {
      goto: 0,
      actions: new Array(this.learned.length).fill(0),
    };

    const zero = (action) => ({ repetition: 0, count: 0, action });
    const zeroState = () => this.learned.map(action => zero(action));

    const incrState = (i, state) => {
      const copy = JSON.parse(JSON.stringify(state));
      copy[i].count++;
      copy[i].repetition++;
      return copy;
    }

    const limitsOk = (state) => {
      for (let i = 0; i < state.length; i++) {
        const action = state[i].action;
        const limit = action.limit;
        const count = state[i].count;
        if (limit && count >= limit) {
          return false;
        }
      }
      return true;
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
            usage.actions[i]++;
          }
          break;

        case 'first':
          // `first` mode always executes the action on the same element
          outcome = await fetcher.act(ctx, action, {});
          usage.actions[i]++;
          break;

        case 'distinct':
          // `distinct` mode always executes the action on distinct elements,
          // based on unique html.
          outcome = await fetcher.act(ctx, action, seen);
          usage.actions[i]++;
          seen[outcome.html] = true;
          break;
      }

      ok &&= outcome?.ok || action.optional;

      return ok;
    }

    const goto = async () => {
      usage.goto++;
      await fetcher.goto(this.url, ctx);
    }

    const ctx = {};

    try {
      await fetcher.start(ctx);

      if (!this.learned || this.learned.length == 0) {
        logger.debug(`${this} No actions, just a simple URL goto`);
        await goto();
        const doc = await this.current(fetcher, ctx);
        yield Promise.resolve({ doc });
        return;
      }

      let state = zeroState();

      while (true) {
        if (!limitsOk(state)) {
          logger.debug(`${this} Hit limits, break`);
          break;
        }

        await goto();

        // Don't use doc, but this is needed to check load conditions
        await this.current(fetcher, ctx);

        let i;
        let ok;
        for (i = 0; i < state.length; i++) {
          ok = await act(i, state);
          logger.debug(`${this} Execute iteration ${i} ok=${ok} state=${JSON.stringify(state)}`);

          if (!ok) {
            for (let j = i; j < this.learned.length; j++) {
              state[j].repetition = 0;
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
          i--;
        }

        state = incrState(i, state);

        logger.debug(`${this} State after incrementing: ${JSON.stringify(state)}`);

        if (ok) {
          const doc = await this.current(fetcher, ctx);
          logger.debug(`${this} Yielding a document: ${doc}`);
          yield Promise.resolve({ doc, usage });
        }
      }

    } finally {
      await fetcher.finish(ctx);
    }

    yield Promise.resolve({ usage });
  }

  async current(fetcher, ctx) {
    const doc = await pTimeout(fetcher.current(ctx), { milliseconds: this.loadTimeout });
    logger.debug(`${this} Got document: ${doc}`);
    return doc;
  }

  async checkAction(goal, before, after) {
    if (domainSpecificInstructions(this.url)) {
      logger.debug(`${this} Assume action is correct because of domain specficic instructions for ${this.url}`);
      return;
    }

    const context = {
      goal,
      before: `>>>> URL before action: ${before.url}\n>>>> Text before action: ${before.text}`,
      after: `>>>> URL after action: ${after.url}\n>>>> Text after action: ${after.text}`,
    };

    // TODO: support / use two flex fields
    const { prompt } = await prompts.checkAction.renderCapped(context, 'after', this.ai);
    logger.debug(`${this} Check if ${goal} succeeded`);
    const answer = await this.ai.ask(prompt, { format: 'json' });
    logger.debug(`${this} Got answer for ${goal} success: ${JSON.stringify(answer.partial)}`);
    return answer.partial.didSucceed == 'yes';
  }
}

const domainSpecificInstructions = (url) => {
  const matchers = [
    {
      prefix: /^https:\/\/([a-zA-Z0-9-]+\.)?x\.com/,
      instruction: 'You are on x.com, which paginates by scrolling down exactly one window length. Your pagination should do this.',
    },
    {
      prefix: /^https:\/\/([a-zA-Z0-9-]+\.)?producthunt\.com/,
      instruction: `You are on ProductHunt, which paginates using a button with the text "See all of today's products" in it`,
    },
    {
      prefix: /^https:\/\/([a-zA-Z0-9-]+\.)?google\.com\/maps/,
      instruction: 'You are on Google Maps. Paginate using these two steps: (1) Click on the text "Results" to focus on the results area and (2) scroll down exactly one window length.',
    },
    {
      prefix: /^https:\/\/www.steimatzky.co.il/,
      instruction: 'You are on steimatzky.co.il. Paginate by scrolling down to the bottom.',
    },
  ];
  const match = matchers.find(({ prefix }) => prefix.test(url));
  let result;
  if (match) {
    result = '\n>> Follow this important domain specific guidance: ' + match.instruction;
    logger.debug(`Adding domain specific prompt: ${result}`);
  } else {
    result = '';
  }
  return result;
}
