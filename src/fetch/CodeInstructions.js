import chalk from 'chalk';
import pTimeout from 'p-timeout';
import { logger as defaultLogger } from "../log/logger.js";
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

      // Define parameters for Author
      // const goal = command.prompt.replace(nextPageCommand, nextPagePrompt);
      // const init = async () => {
      //   const ctx = {};
      //   await fetcher.start(ctx);
      //   await fetcher.goto(this.url, ctx);
      //   const doc = await this.current(fetcher, ctx);
      //   if (!doc) {
      //     throw new Error(`${this} Couldn't get document to learn commands ${this.url}`);
      //   }
      //   return { html: doc.html, ctx };
      // }
      // const exec = async (fn, cb, { ctx }) => {
      //   return fn(ctx.page, cb, (msg) => this.aiLog(msg), cb);
      // }
      // const finish = async ({ ctx }) => {
      //   fetcher.finish(ctx);
      // }

    this.logger.debug(`${this} Calling author to write code for ${goals.join('\n')}`);
    const fns = await author.get(this.url, goals);

    console.log('fns', fns);

    const chan = createChannel();

    // Set up fetcher
    const execPromise = new Promise(async (ok) => {
      const ctx = {};
      await this.fetcher.start(ctx);
      try {
        console.log('!!! EXEC PROMISE !!!');

        await this.fetcher.goto(this.url, ctx);
        for (const [i, fn] of fns.entries()) {
          const run = new Promise((ok) => {
            console.log('inside promise');
            fn(
              ctx.page,

              // fnSendResults
              async () => {
                console.log('===> fnSendResults');
                await new Promise(ok => setTimeout(ok, 2000));
                // Only send documents from last step
                if (i == fns.length - 1) {
                  const doc = await this.fetcher.current(ctx);
                  console.log('===> CHAN SEND DOC:' + doc);
                  chan.send({ doc });
                }
                return true;
              },

              // fnDebugLog
              (msg) => {
                // TODO: use logger
                console.log('AI MESSAGE:', msg);
              },

              // done
              async () => {
                // TODO: use logger
                // this.logger.debug(`${this} Generated code is done`);
                console.log(`Generated code is done`);
                ok();
              }
            )
          });
          // await run;

          // Wait for it to finish
          await pTimeout(run, { milliseconds: 120 * 1000 });
        }
      } finally {
        this.fetcher.finish(ctx).catch((e) => {
          this.logger.error(`${this} Ignoring error on finish: ${e}`);
        });

        chan.end();
        ok();
      }
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

    await execPromise;

      // Run the code
      // const state = await init();
      // try {
      //   const handleHtml = async () => {
      //     await new Promise(ok => setTimeout(ok, 2000));
      //     const doc = await this.current(fetcher, state.ctx);
      //     chan.send({ doc });
      //     return true; // for now always continue
      //   }
      //   const run = new Promise((ok) => {
      //     fn(
      //       state.ctx.page,
      //       // fnSendHtml
      //       handleHtml,
      //       // fnDebugLog
      //       (msg) => this.aiLog(msg),
      //       // done
      //       async () => {
      //         this.logger.debug(`${this} Generated code is done`);
      //         chan.end();
      //         ok();
      //       }
      //     )
      //   });

      //   for await (const val of chan.receive()) {
      //     if (val.end) {
      //       break;
      //     }
      //     if (val.doc) {
      //       this.logger.info(`${this} Yielding a document ${val.doc}`);
      //       yield Promise.resolve({ doc: val.doc });
      //     }
      //   }

      //   // Wait for it to finish
      //   await pTimeout(run, { milliseconds: 10 * 1000 });
  // } catch (e) {
  //   this.logger.error(`${this} Got error: ${e}`);
  //   throw e;

  // } finally {
  //   // Cleanup
  //   await finish(state);
  // }
  }

  async current(fetcher, ctx) {
    const doc = await pTimeout(fetcher.current(ctx), { milliseconds: this.timeout });
    this.logger.debug(`${this} Got document: ${doc}`);
    return doc;
  }
}
