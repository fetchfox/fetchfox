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

    const indexes = [];
    for (const action of this.learned) {
      indexes.push({
        index: 0,
        repeat: action.repeat,
        repetition: 0,
      });
    }

    const incr = (it) => {
      if (++it.repetition >= it.repeat) {
        it.repetition = 0;
        it.index++;
      }
    }

    const isFirst = (it) => {
      return it.repetition == 0 && it.index == 0;
    }

    let ctx = {};
    await fetcher.start(ctx);
    try {
      ctx = { ...ctx, ...(await fetcher.goto(this.url, ctx)) };

      let i = 0;

      while (true) {
        logger.debug(`${this} Execute instructions, iterate i=${i}, indexes=${indexes}`);

        const action = this.learned[i];

        const shouldYield = (
          action?.yieldBefore && isFirst(indexes[i]) ||
          !action);

        if (shouldYield) {
          const doc = await pTimeout(fetcher.current(ctx), { milliseconds: this.loadTimeout });
          // const doc = await fetcher.current(ctx);
          logger.info(`${this} Yielding before executing any actions: ${doc}`);
          yield Promise.resolve(doc);
          action && incr(indexes[i]);
        }

        if (!action) {
          break;
        }

        let success;
        if (indexes[i].index > action.max) {
          logger.debug(`${this} Hit max iterations of action i=${i} action=${action}`);
          success = false;
        } else {
          success = await fetcher.act(ctx, action, indexes[i].index);
        }

        if (success) {
          const isLast = i == this.learned.length - 1;
          if (isLast) {
            incr(indexes[i]);
            const doc = await fetcher.current(ctx);
            logger.info(`${this} Executing instructions found: ${doc}`);
            yield Promise.resolve(doc);
          } else {
            i++;
          }
        }

        if (!success) {
          if (i == 0) {
            // End condition: we failed on the first action
            break;
          } else {
            incr(indexes[i - 1]);
            for (let j = i; j < this.learned.length; j++) {
              indexes[j] = 0;
            }
            i = 0;
          }
        }
      }
    } finally {
      await fetcher.finish(ctx);
    }
  }

}
