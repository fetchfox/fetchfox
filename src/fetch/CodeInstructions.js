import chalk from 'chalk';
import pTimeout from 'p-timeout';
import { logger as defaultLogger } from "../log/logger.js";
import { getAI } from '../ai/index.js';
import { shortObjHash, createChannel } from '../util.js';
import * as prompts from './prompts.js';

const aiLog = (logger, msg) => {
  logger.debug(`${this} ${chalk.bold('AI Log Message:')} ${msg}`);
}


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
    this.loadTimeout = options?.loadTimeout || 60000;
    this.limit = options?.limit;
    this.hint = options?.hint;
    this.logger = options?.logger || defaultLogger
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
    if (this.commands.length == 0 && this.hint) {
      this.commands.push({ prompt: this.hint });
    }
    const ctx = {};

    try {
      await fetcher.start(ctx);
      await fetcher.goto(this.url, ctx);

      const onlyPagination = (
        this.commands.length == 1 &&
        this.commands[0].prompt == nextPageCommand
      );

      if (onlyPagination) {
        const domainSpecific = domainSpecificInstructions(this.url);
        const paginationLimit = this.commands[0].limit || 25;

        this.commands = [
          // {
          //   prompt: acceptCookiesPrompt,
          //   optional: true,
          //   timeout: 5000,
          // },
          {
            prompt: nextPagePrompt + domainSpecific,
            pagination: true,
            limit: paginationLimit,
          },
        ];
      }

      for (const command of this.commands) {
        const doc = await this.current(fetcher, ctx);

        if (!doc) {
          throw new Error(`${this} Couldn't get document to learn commands ${this.url}`);
        }
        this.logger.debug(`${this} Learn how to do: ${command.prompt}`);

        const context = {
          html: doc.html,
          command: command.prompt,
          limit: command.limit,
          timeout: fetcher.actionTimeout,
          hint: this.hint,
        };

        const actionPrompts = await prompts.pageActionCode
          .renderMulti(context, 'html', this.ai.advanced);

        const answers = (
          await Promise.allSettled(actionPrompts.map(
            (prompt) => this.ai.advanced.ask(prompt, { format: 'text' })
          ))
        )
          .filter(result => result.status == 'fulfilled');

        const answer = answers[0];
        this.logger.debug(`${this} Got code for command ${command.prompt}: ${answer.value.partial}`);


        const code = answer.value.partial
          .replaceAll('```javascript', '')
          .replaceAll('```', '');
        const chan = createChannel();
        const fn = new Function('page', 'fnSendHtml', 'fnDebugLog', 'done', code);

        const evaluation = await this.evaluateFn(fetcher, ctx, command.prompt, fn);

        throw 'STOP';

        const cb = async () => {
          const doc = await this.current(fetcher, ctx);
          chan.send({ doc });
          return true;
        }

        const fnp = new Promise(ok => {
          fn(ctx.page, cb, (msg) => aiLog(this.logger, msg),
             () => {
               chan.end();
               ok();
             })
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

        await fnp;
      }
    } catch (e) {
      this.logger.error(`${this} Got error: ${e}`);
      throw e;

    } finally {
      await fetcher.finish(ctx);
    }
  }

  async evaluateFn(fetcher, ctx, goal, fn) {
    const before = await this.current(fetcher, ctx);
    let i = 0;
    const after = await new Promise((ok) => {
      fn(
        ctx.page,
        async () => {
          const doc = await this.current(fetcher, ctx);
          ok(doc);
          return false;
        },
        (msg) => aiLog(this.logger, msg),
        () => {
          console.log('done?');
          ok();
        });
    });

    console.log('before: ' + before);
    console.log('after:  ' + after);
    console.log('fn.toString()', fn.toString());

    const context = {
      before: before.html,
      after: after?.html || 'No action taken, so there is no after HTML',
      code: fn.toString(),
      command: goal,
    };

    console.log(context);

    const { prompt } = await prompts.evaluateFn
      .renderCapped(context, ['before', 'after'], this.ai.advanced);
    const answer = await this.ai.advanced.ask(prompt, { format: 'json' });
    console.log('answer', answer.partial);

    throw 'STOP EVAL';
  }

  async current(fetcher, ctx) {
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
