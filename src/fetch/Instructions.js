import pTimeout from 'p-timeout';
import { logger as defaultLogger } from "../log/logger.js";
import { getAI } from '../ai/index.js';
import { shortObjHash } from '../util.js';
import * as prompts from './prompts.js';

// TODO:
// - If pagination is the only action, don't restart from the beginning.
// - More generally, this applies if there is only a single `repeat` action
// - Detect and use changes in URL as a shortcut

const nextPageCommand = '{{nextPage}}';

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
    this.ai = options?.ai || getAI(null, { cache: this.cache });
    this.loadTimeout = options?.loadTimeout || 60000;
    this.limit = options?.limit;
    this.hint = options?.hint;
    this.generationConfig = {
      temperature: options?.temperature || 0.5,
      topP: options?.topP || 0.3,
    };
    if (this.ai.model.includes("o3-mini") || this.ai.model.includes("gemini")) {
      this.generationConfig = {};
    }

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

    // TODO: re-enable this
    // if (hint) {
    //   this.logger.debug(`${this} Received cache key, using domain=${domain}, hint=${hint}`);
    //   const domain = (new URL(this.url)).hostname;
    //   hash = shortObjHash({
    //     domain,
    //     hint,
    //     commands: this.commands.map(it => it.prompt),
    //   });
    // } else {
    // }

    this.logger.debug(`${this} No cache key, using url=${this.url}`);
    hash = shortObjHash({
      url: this.url,
      commands: this.commands.map(it => it.prompt),
    });

    return `instructions-${hash}`;
  }

  async *learn(fetcher, options) {
    const cacheKey = options?.cacheKey;
    const learned = [];

    if (this.commands.length == 0 && this.hint) {
      this.commands.push({ prompt: this.hint });
    }

    const key = this.cacheKey(cacheKey);
    if (this.cache) {
      const cached = await this.cache.get(key);
      if (cached) {
        this.logger.debug(`${this} Cache hit for ${key}`);
        this.learned = cached;
        return;
      } else {
        this.logger.debug(`${this} Cache miss for ${key}`);
      }
    }

    const ctx = {};

    try {
      await fetcher.start(ctx);
      await fetcher.goto(this.url, ctx);

      // If pagination is the only action, yield the first page before
      // learning how to do pagination
      const onlyPagination = (
        this.commands.length == 1 &&
        this.commands[0].prompt == nextPageCommand
      );
      if (onlyPagination) {
        const domainSpecific = domainSpecificInstructions(this.url);

        this.commands = [
          {
            prompt: acceptCookiesPrompt,
            optional: true,
            // In case there are multiple, click up to three times
            // TODO: more robust solution here
            mode: 'all',
            limit: 3,
            timeout: 5000,
          },
          {
            prompt: nextPagePrompt + domainSpecific,
            mode: 'repeat',
            pagination: true,
            limit: this.commands[0].limit,
          },
        ];

        this.logger.debug(`${this} Expanded command for pagination: ${JSON.stringify(this.commands, null, 2)}`);
        this.logger.info(`${this} Only instructions are to paginate, so yield first page in learn`);

        const doc = await this.current(fetcher, ctx);
        yield Promise.resolve({ doc });
      }

      // TODO: It would be nice of learning supported caching. Right now,
      // we use the live page for interactions, but it should be possible to
      // cache a chain of url + commands
      for (const command of this.commands) {
        const doc = await this.current(fetcher, ctx);

        if (!doc) {
          throw new Error(`${this} Couldn't get document to learn commands ${this.url}`);
        }
        this.logger.debug(`${this} Learn how to do: ${command.prompt}`);

        const context = {
          html: doc.html,
          command: command.prompt,
          hint: this.hint,
        };

        const actionPrompts = await prompts.pageAction
          .renderMulti(context, 'html', this.ai.advanced);

        const answers = (
          await Promise.allSettled(actionPrompts.map(
            (prompt) => this.ai.advanced.ask(prompt, { format: 'json', ...this.generationConfig })
          ))
        )
          .filter(result => result.status == 'fulfilled');
        this.logger.info(JSON.stringify(answers));

        const candidates = [];
        const seen = {};
        for (const { value: answer } of answers) {
          const raw = answer.partial.candidates || [];

          for (const it of raw) {
            const type = it.candidateAction;
            const limit = command.limit;
            const timeout = command.timeout;
            const optional = command.optional || it.optionalAction == 'yes';
            const mode = command.mode || answer.partial.actionMode || 'distinct';
            const confidence = it.candidateConfidence;

            const shared = { type, limit, timeout, optional, mode, confidence };

            let candidate;
            switch (type) {
              case 'click':
                candidate = [
                  {
                    ...shared,
                    arg: it.candidatePlaywrightSelector,
                  }
                ];
                break;

              case 'scroll':
                candidate = [
                  {
                    ...shared,
                    arg: it.candidateScrollType,

                    // Infinite scroll should only yield one document
                    singleYield: it.candidateScrollType == 'bottom',
                  }
                ];
                break;

              case 'click-scroll':
                candidate = [
                  {
                    ...shared,
                    type: 'click',
                    arg: it.candidatePlaywrightSelector,
                    mode: 'first',
                  },
                  {
                    ...shared,
                    type: 'scroll',
                    arg: it.candidateScrollType,
                  },
                ]
                break;
            }

            const ser = JSON.stringify(candidate);
            if (seen[ser]) {
              continue;
            }
            seen[ser] = true;
            candidates.push(candidate);
          }
        }

        // Sort in confidence order, and for now just pick the first one
        // Use confidence of the last action in the series
        candidates.sort((a, b) => {
          const aCon = (a[a.length - 1].confidence || 0);
          const bCon = (b[b.length - 1].confidence || 0);
          return bCon - aCon;
        });

        let working;

        this.logger.info(candidates);
        for (const set of candidates) {
          this.logger.debug(`${this} Check action on ${JSON.stringify(set)}`);

          let ok = true;
          try {

            // TODO: Re-enable action checks. Skip for now to run faster.
            // ok = await this.checkAction(
            //   fetcher,
            //   doc,
            //   command.prompt,
            //   [...learned, ...set]);

            for (const action of set) {
              const outcome = await fetcher.act(ctx, action, {});
              ok &&= outcome.ok
              if (!ok) break;
            }

          } catch (e) {
            this.logger.warn(`${this} Got error while checking action set ${JSON.stringify(set)}, skipping: ${e} ${e.stack}`);
            if (process.env.STRICT_ERRORS) {
              throw e;
            }
            ok = false;
          }

          this.logger.debug(`${this} Checked action ${JSON.stringify(set)} and got ok=${ok}`);
          if (ok) {
            working = set;
            break;
          }
        }

        this.logger.debug(`${this} Found working action set=${JSON.stringify(working)} for ${command.prompt}`);

        if (working) {
          learned.push(...working);
        } else {
          this.logger.warn(`${this} Could not find a working action for ${command.prompt}`);
        }
      }

      this.learned = learned;
      if (!this.learned) {
        this.learned = [];
      }
      if (this.cache) {
        this.logger.debug(`${this} Setting cache for ${key}`);
        await this.cache.set(key, this.learned);
      }

      this.logger.info(`${this} Learned actions: ${JSON.stringify(this.learned, null, 2)}`);

    } catch (e) {
      this.logger.error(`${this} Got error: ${e}`);
      throw e;

    } finally {
      await fetcher.finish(ctx);
    }
  }

  async *execute(fetcher) {
    if (this.commands?.length && !this.learned?.length) {
      throw new Error('must learn before execute');
    }

    this.logger.info(`${this} Execute instructions: url=${this.url} learned=${JSON.stringify(this.learned)}`);

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

    const act = async (i, state, { tailRepeat }) => {
      const action = state[i].action;

      let ok = true;
      let outcome;

      switch (action.mode) {
        case 'repeat':
          // `repeat` mode exeutes an action multiple times on the same element.
          // It first exeutes it 0 times, then 1 times, then 2 times, etc.
          outcome = { ok: true };
          if (tailRepeat) {
            if (state[i].repetition > 0) {
              outcome = await fetcher.act(ctx, action, {});
              usage.actions[i]++;
            }

          } else {
            for (let r = 0; r < state[i].repetition; r++) {
              outcome = await fetcher.act(ctx, action, {});
              usage.actions[i]++;
            }
          }
          break;

        case 'all':
          {
            // `all` mode always executes the action on all elements each time, up to limit
            let attempt = 0;
            while (true) {
              if (attempt > action.limit) break;
              outcome = await fetcher.act(ctx, action, seen);
              seen[outcome.html] = true;
              usage.actions[i]++;
              if (!outcome.ok) break;
              attempt++;
            }
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

        default:
          throw new Error(`Unhandled mode: ${action.mode}`);
      }

      ok &&= outcome?.ok || action.optional;

      return ok;
    }

    const goto = async () => {
      this.logger.debug(`${this} Goto: ${this.url}`);
      usage.goto++;
      await fetcher.goto(this.url, ctx);
    }

    const ctx = {};

    // For infinite scroll, only yield one document. The `finalDoc` variable
    // keeps track of the last document we saw, which is expected to have
    // the most data in it.
    let finalDoc;

    try {
      await fetcher.start(ctx);
      await goto();

      const noActions = !this.learned || this.learned.length == 0;

      // This is an optimization for when the last action is a repeat. In
      // those cases, we don't need to goto the original URL on each iteration.
      // This is common for pagination and dramatically reduces runtime for
      // those cases, becuase it becomes O(N) on number of pages.
      const tailRepeat = (
        this.learned?.length &&
        this.learned.filter(it => !['repeat', 'first', 'all'].includes(it.mode)).length == 0 &&
        this.learned[this.learned.length - 1].mode == 'repeat');

      if (noActions) {
        this.logger.debug(`${this} No actions, just a simple URL goto`);
        const doc = await this.current(fetcher, ctx);
        yield Promise.resolve({ doc });
        return;
      }

      let state = zeroState();

      while (true) {
        if (!limitsOk(state)) {
          this.logger.debug(`${this} Hit limits, break`);
          break;
        }

        if (!tailRepeat) {
          await goto();
        }

        // Don't use doc, but this is needed to check load conditions
        await this.current(fetcher, ctx);

        let i;
        let ok;
        for (i = 0; i < state.length; i++) {

          ok = await act(i, state, { tailRepeat });

          this.logger.debug(`${this} Execute iteration ${i} ok=${ok} state=${JSON.stringify(state)}`);

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
            this.logger.debug(`${this} Got not ok and all upstream are optional, done`);
            break;
          }
          i--;
        }

        state = incrState(i, state);

        this.logger.debug(`${this} State after incrementing: ${JSON.stringify(state)}`);

        if (ok) {
          const doc = await this.current(fetcher, ctx);
          this.logger.debug(`${this} Yielding a document: ${doc}`);

          if (this.learned[i].singleYield) {
            finalDoc = doc;
          } else {
            yield Promise.resolve({ doc, usage });
          }
        }
      }

    } finally {
      await fetcher.finish(ctx);
    }

    yield Promise.resolve({ usage, doc: finalDoc });
  }

  async current(fetcher, ctx) {
    const doc = await pTimeout(fetcher.current(ctx), { milliseconds: this.loadTimeout });
    this.logger.debug(`${this} Got document: ${doc}`);
    return doc;
  }

  async checkAction(fetcher, before, goal, sequence) {
    const copy = JSON.parse(JSON.stringify(sequence))
      .map(it => ({ ...it, limit: 2 }));
    const old = this.learned;
    this.learned = copy;

    const domainSpecific = domainSpecificInstructions(this.url);

    try {
      const docs = [before];
      for await (const { doc } of this.execute(fetcher)) {
        if (!doc) continue;
        docs.push(doc);
      }

      let count = 1;
      let iterations = '';
      for (const doc of docs) {
        // Remove port so that URLs are stable in testing for cache keys
        const noPort = (url) => {
          try {
            const u = new URL(url);
            u.port = '';
            return u.toString();
          } catch {
            return url;
          }
        }

        iterations += `>>>> URL on action iteration ${count}: ${noPort(doc.url)}\n`;
        iterations += `>>>> Page state on action iteration ${count}: ${doc.text}\n`;
        iterations += `\n\n`;
        count++;
      }

      const context = {
        action: JSON.stringify(sequence[sequence.length - 1], null, 2),
        goal,
        iterations,
        domainSpecific: '',
      };

      if (domainSpecific) {
        context.domainSpecific = `>>>> Note that these actions are based on the domain specific instructions below: ${domainSpecific}`;
      }

      const { prompt } = await prompts.checkAction.renderCapped(
        context, 'iterations', this.ai.advanced);

      this.logger.debug(`${this} Check if ${goal} succeeded`);
      const answer = await this.ai.advanced.ask(prompt, { format: 'json', ...this.generationConfig });
      this.logger.debug(`${this} Got answer for ${goal} success: ${JSON.stringify(answer.partial)}`);

      return answer.partial.didComplete == 'yes';
    } finally {
      this.learned = old;
    }
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
      instruction: 'You are on Google Maps. Paginate using by clicking to focus on the results area. If you see the text "Results", click on that. Otherwise, find some other text to click on to focus on the results area. Then, scroll down a page length using the page down button.',
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

const acceptCookiesPrompt = `Accept cookies or any other terms, if necessary. This is an optional step, if there is no cookie or other terms to accept, do nothing.

If there are multiple terms to accept, return one action for each.

This includes any of the following
- Cookie prompts (accept cookie, do not manage unless necessary)
- Age verification terms (agree that you are the required age)
- Accepting terms of service in general (accept the terms)
`;

const nextPagePrompt = `>>>> You must provide accurate instructions to get to the next page while following all rules given.

Note: 
- If there are multiple pages linked and a next page button, make sure you click the next page button, not any specific page.
- The next button may have the word next, or some sort of right-arrow like character.
- If you're less confident you may scroll or click a button to Load More data or Show More data.

You will know pagination was successful if you see relevant new results on each iteration.

Unless otherwise instructed, your pagination should focus on the *main* content of the page, not extra content or small widgets.`;
