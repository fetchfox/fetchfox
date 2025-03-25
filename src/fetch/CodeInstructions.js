import { logger as defaultLogger } from "../log/logger.js";
import { getFetcher } from '../fetch/index.js';
import { getKV } from '../kv/index.js';
import { getAI } from '../ai/index.js';
import { Author } from '../author/index.js';
import { nextPageCommand, nextPagePrompt, acceptCookiesPrompt } from './Instructions.js';

export const CodeInstructions = class {
  constructor(url, commands, options) {
    this.url = url;
    this.commands = commands;
    this.cache = options?.cache;
    this.signal = options?.signal;
    this.fetcher = options?.fetcher || getFetcher(
      null,
      { cache: this.cache, signal: this.signal });
    this.ai = options?.ai || getAI(
      null,
      { cache: this.cache, signal: this.signal });
    this.kv = options?.kv || getKV();
    this.timeout = options?.timeout || 60000;
    this.limit = options?.limit;
    this.hint = options?.hint;
    this.logger = options?.logger || defaultLogger
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  async *learn() {
    // no-op
  }

  async *execute(fetcher) {
    this.logger.info(`${this} Execute code instructions`);

    const goals = [];
    for (const command of this.commands) {
      if (command.prompt == nextPageCommand) {
        goals.push(acceptCookiesPrompt);
        goals.push(nextPagePrompt);
      } else {
        goals.push(command.prompt);
      }
    }

    if (!goals.length) {
      this.logger.info(`${this} No command, just yield current page`);
      const ctx = {};
      await fetcher.start(ctx);
      await fetcher.goto(this.url, ctx);
      const doc = await fetcher.current(ctx);
      yield Promise.resolve({ doc });
      await fetcher.finish(ctx);
      return;
    }

    this.logger.info(`${this} Use author for ${goals.length } goals`);
    this.logger.debug(`${this} Goals are: ${goals.join('\n\n')}`);
    const author = new Author({
      fetcher: this.fetcher,
      kv: this.kv,
      ai: this.ai,
      cache: this.cache,
      logger: this.logger,
      timeout: this.timeout,
    });
    for await (const r of author.run(this.url, goals)) {
      yield Promise.resolve(r);
    }
  }
}
