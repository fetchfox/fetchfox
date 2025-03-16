import chalk from 'chalk';
import pTimeout from 'p-timeout';
import { logger as defaultLogger } from "../log/logger.js";
import { getAI } from '../ai/index.js';
import { shortObjHash, createChannel } from '../util.js';
import { Author } from './Author.js';
import * as prompts from './prompts.js';

export const nextPageCommand = '{{nextPage}}';

export const CodeInstructions = class {
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
    this.ai = options?.ai || getAI(null, { cache: this.cache });
    this.kv = options.kv;
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
    return JSON.stringify({ url: this.url, commands: this.commands });
  }

  unshiftCommand(command) {
    this.learned = null;
    this.commands.unshift(command);
  }

  cacheKey() {
    let hash;
    hash = shortObjHash({
      url: this.url,
      commands: this.commands.map(it => it.prompt),
    });
    return `instructions-${hash}`;
  }

  async *learn() {
    // no-op
  }

  async *execute(fetcher) {
    this.logger.info(`${this} Execute instructions`);

    try {
      for (const command of this.commands) {
        this.logger.debug(`${this} Learn how to do: ${command.prompt}`);

        const author = new Author(
          this.kv,
          {
            ai: this.ai,
            logger: this.logger,
          });

        // Define parameters for Author
        const namespace = new URL(this.url).hostname;
        const goal = command.prompt;
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
        const handleHtml = async (html) => {
          const doc = await this.current(fetcher, state.ctx);
          chan.send({ doc });
          return true; // for now always continue
        }
        const run = new Promise((ok) => {
          fn(
            state.ctx.page,  // page
            handleHtml,  // fnSendHtml
            (msg) => this.aiLog(msg),  // fnDebugLog
            // done
            async () => {
              this.logger.debug(`${this} Generated code is done`);
              console.log('chan.end');
              chan.end();
              console.log('call ok');
              ok();
            }
          )
        });

        for await (const val of chan.receive()) {

          console.log('GOT val',val);
          console.log('^-- val');

          if (val.end) {
            break;
          }
          if (val.doc) {
            this.logger.info(`${this} Yielding a document ${val.doc}`);
            yield Promise.resolve({ doc: val.doc });
          }
        }
        console.log('await run complete');

        // Wait for it to finish
        await pTimeout(run, { milliseconds: 10 * 1000 });

        console.log('cleanup');

        // Cleanup
        await finish(state);
      }
    } catch (e) {
      this.logger.error(`${this} Got error: ${e}`);
      throw e;

    } finally {
      // await fetcher.finish(ctx);
    }
  }

  async current(fetcher, ctx) {
    // console.log('get current', fetcher, ctx);
    const doc = await pTimeout(fetcher.current(ctx), { milliseconds: this.loadTimeout });
    this.logger.debug(`${this} Got document: ${doc}`);
    return doc;
  }
}

const domainSpecificInstructions = (url) => {
  const matchers = [
    {
      prefix: /^https:\/\/([a-zA-Z0-9-]+\.)?x\.com/,
      instruction: 'You are on x.com, which paginates by scrolling down exactly one window height using page down. Your pagination should do this.',
    },
    {
      prefix: /^https:\/\/([a-zA-Z0-9-]+\.)?producthunt\.com/,
      instruction: `You are on ProductHunt, which paginates using a button with the text "See all of today's products" in it`,
    },
    {
      prefix: /^https:\/\/([a-zA-Z0-9-]+\.)?google\.com\/maps/,
      instruction: 'You are on Google Maps. Paginate using by clicking to focus on the results area. If you see the text "Results", click on that. Otherwise, find some other text to click on to focus on the results area before doing anything. Then, scroll down a page length using the page down button once for each pagination.',
    },
  ];
  const match = matchers.find(({ prefix }) => prefix.test(url));
  let result;
  if (match) {
    result = '\n>> Follow this important domain specific guidance: ' + match.instruction;
    defaultLogger.debug(`Adding domain specific prompt: ${result}`);
  } else {
    result = '';
  }
  return result;
}



const acceptCookiesPrompt = `Click through and prompts to access the page, like cookie acceptance, age verification, terms of service, or other modals and popups, IF THEY EXIST.

This includes any of the following
- Cookie prompts (accept cookie, do not manage unless necessary)
- Age verification terms (agree that you are the required age)
- Accepting terms of service in general (accept the terms)
- Closing email subscription popup
- Closing any modal overlay

If none exist, don't do anything`;

const nextPagePrompt = `>>>> You must provide accurate instructions to get to the next page while following all rules given.

Note: 
- If there are multiple pages linked and a next page button, make sure you click the next page button, not any specific page.
- The next button may have the word next, or some sort of right-arrow like character.
- If you're less confident you may scroll or click a button to Load More data or Show More data.

Unless otherwise instructed, your pagination should focus on the *main* content of the page, not extra content or small widgets.`;
