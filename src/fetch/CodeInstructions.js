import chalk from 'chalk';
import pTimeout from 'p-timeout';
import { logger as defaultLogger } from "../log/logger.js";
import { getKV } from '../kv/index.js';
import { getAI } from '../ai/index.js';
import { shortObjHash, createChannel } from '../util.js';
import { Author } from './Author.js';
import { nextPageCommand, acceptCookiesPrompt, nextPagePrompt } from './Instructions.js';

export const CodeInstructions = class {
  constructor(url, command, options) {
    this.url = url;
    this.command = command;
    this.cache = options?.cache;
    this.ai = options?.ai || getAI(null, { cache: this.cache });
    this.kv = options?.kv || getKV();
    this.loadTimeout = options?.loadTimeout || 60000;
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

  serialize() {
    return JSON.stringify({ url: this.url, command: this.command });
  }

  cacheKey() {
    let hash;
    hash = shortObjHash({
      url: this.url,
      command: this.command.prompt,
    });
    return `instructions-${hash}`;
  }

  unshiftCommand(command) {
    this.logger.info(`${this} Unshift command: ${command.prompt}`);

    this.learned = null;
    if (!this.command) {
      this.command = command;
    } else {
      this.command.prompt += '\n' + command.prompt;
    }
  }

  async *learn() {
    // no-op
  }

  async *execute(fetcher) {
    this.logger.info(`${this} Execute code instructions`);

    if (!this.command) {
      this.logger.info(`${this} No command, just yield current page`);
      const ctx = {};
      await fetcher.start(ctx);
      await fetcher.goto(this.url, ctx);
      const doc = await this.current(fetcher, ctx);
      yield Promise.resolve({ doc });
      await fetcher.finish(ctx);
      return;
    }

    const command = this.command;
    this.logger.debug(`${this} Learn how to do: ${command.prompt}`);

    const author = new Author({
      kv: this.kv,
      ai: this.ai,
      logger: this.logger,
    });

    // Define parameters for Author
    const namespace = new URL(this.url).hostname;
    const goal = command.prompt.replace(nextPageCommand, nextPagePrompt);
    const init = async () => {
      const ctx = {};
      await fetcher.start(ctx);
      await fetcher.goto(this.url, ctx);
      const doc = await this.current(fetcher, ctx);
      if (!doc) {
        throw new Error(`${this} Couldn't get document to learn commands ${this.url}`);
      }
      return { html: doc.html, ctx };
    }
    const exec = async (fn, cb, { ctx }) => {
      return fn(ctx.page, cb, (msg) => this.aiLog(msg), cb);
    }
    const finish = async ({ ctx }) => {
      fetcher.finish(ctx);
    }

    this.logger.debug(`${this} Calling author to write code for ${goal}`);
    const fn = await author.get(namespace, goal, init, exec, finish);
    const chan = createChannel();

    // Run the code
    const state = await init();
    try {
      const handleHtml = async () => {
        await new Promise(ok => setTimeout(ok, 2000));
        const doc = await this.current(fetcher, state.ctx);
        chan.send({ doc });
        return true; // for now always continue
      }
      const run = new Promise((ok) => {
        fn(
          state.ctx.page,

          // fnSendHtml
          handleHtml,

          // fnDebugLog
          (msg) => this.aiLog(msg),

          // done
          async () => {
            this.logger.debug(`${this} Generated code is done`);
            chan.end();
            ok();
          }
        )
      });

      for await (const val of chan.receive()) {
        if (val.end) {
          break;
        }
        if (val.doc) {
          this.logger.info(`${this} Yielding a document ${val.doc}`);
          yield Promise.resolve({ doc: val.doc });
        }
      }

      // Wait for it to finish
      await pTimeout(run, { milliseconds: 10 * 1000 });
    } catch (e) {
      this.logger.error(`${this} Got error: ${e}`);
      throw e;

    } finally {
      // Cleanup
      await finish(state);
    }
  }

  async current(fetcher, ctx) {
    const doc = await pTimeout(fetcher.current(ctx), { milliseconds: this.loadTimeout });
    this.logger.debug(`${this} Got document: ${doc}`);
    return doc;
  }
}
