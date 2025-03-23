import chalk from 'chalk';
import pTimeout from 'p-timeout';
import { logger as defaultLogger } from "../log/logger.js";
import { getFetcher } from '../fetch/index.js';
import { getKV } from '../kv/index.js';
import { getAI } from '../ai/index.js';
import { shortObjHash, createChannel } from '../util.js';
import { Author } from './Author.js';
import { nextPageCommand, nextPagePrompt, acceptCookiesPrompt } from './Instructions.js';

export const CodeInstructions = class {
  constructor(url, commands, options) {
    this.url = url;
    this.commands = commands;
    this.cache = options?.cache;
    this.fetcher = options?.fetcher || getFetcher();
    this.ai = options?.ai || getAI(null, { cache: this.cache });
    this.kv = options?.kv || getKV();
    this.timeout = options?.timeout || 60000;
    this.limit = options?.limit;
    this.hint = options?.hint;
    this.logger = options?.logger || defaultLogger
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  aiLog(msg) {
    this.logger.debug(`${chalk.bold('[AIGEN]')} ${msg}`);
  }

  async *learn() {
    // no-op
  }

  async *execute(fetcher) {
    this.logger.info(`${this} Execute code instructions`);

    console.log('this.commands', this.commands);

    const goals = [];
    for (const command of this.commands) {
      if (command.prompt == nextPageCommand) {
        goals.push(acceptCookiesPrompt);
        goals.push(nextPagePrompt);
      } else {
        goals.push(command.prompt);
      }
    }

    console.log('goals', goals);

    if (!goals) {
      this.logger.info(`${this} No command, just yield current page`);
      const ctx = {};
      await fetcher.start(ctx);
      await fetcher.goto(this.url, ctx);
      const doc = await this.current(fetcher, ctx);
      yield Promise.resolve({ doc });
      await fetcher.finish(ctx);
      return;
    }

    // const command = this.commands[0];

    this.logger.debug(`${this} Learn how to do: ${goals.join('\n')}`);
    const author = new Author({
      kv: this.kv,
      ai: this.ai,
      logger: this.logger,
      timeout: this.timeout,
    });

    this.logger.debug(`${this} Calling author to write code for ${goals.join('\n')}`);
    for await (const doc of  author.run(this.url, goals)) {
      yield Promise.resolve(doc);
    }
  }
}
