import pretty from 'pretty';
import pTimeout from 'p-timeout';
import { logger as defaultLogger } from "../log/logger.js";
import { getFetcher } from '../fetch/index.js';
import { getAI } from '../ai/index.js';
import { getKV } from '../kv/index.js';
import { shortObjHash, createChannel } from '../util.js';
import * as prompts from './prompts.js';

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
const toFn = (code) => new AsyncFunction('page', 'fnSendResults', 'fnDebugLog', 'done', code);
const exec = async (fn, fetcher, ctx, cb) =>  {
  console.log('EXEC FN');
  const run = new Promise((ok) => {
    fn(
      ctx.page,

      // fnSendResults
      async () => {
        console.log('TODO: fnSendResults');
        await new Promise(ok => setTimeout(ok, 2000));
        if (cb) {
          const doc = await fetcher.current(ctx);
          const r = await cb({ doc });
          if (!r) {
            ok();
          }
          return r;
        } else {
          return true;
        }
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
        // chan.end();
        ok();
      }
    )
  });

  await run;
}

export const Author = class {
  constructor(options) {
    this.fetcher = options?.fetcher || getFetcher();
    this.kv = options?.kv || getKV();
    this.ai = options?.ai || getAI(null, { cache: this.cache });
    this.logger = options?.logger || defaultLogger
    this.timeout = options?.timeout || 8000;
    this.threshold = options?.threshold || 65;
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  async *run(url, goals, cb) {
    const fns = await this.get(url, goals);
    const chan = createChannel();

    const promise = new Promise(async (ok) => {
      const ctx = {};
      await this.fetcher.start(ctx);
      try {
        await this.fetcher.goto(url, ctx);

        for (const [i, fn] of fns.entries()) {
          // Only send results for last step
          const cb = (i == fns.length - 1)
            ? (r) => { chan.send(r); return true }
            : null;
          const p = exec(fn, this.fetcher, ctx, cb);
          await pTimeout(p, { milliseconds: 300 * 1000 });
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

    await promise;
  }

  async get(url, goals) {
    this.logger.debug(`${this} Get code for goal: ${goals.join('\n')}`);

    const hash = shortObjHash({ goals });
    const key = `author-${hash}`;

    this.logger.debug(`${this} Look up goal in kv: ${key}`);

    const records = (await this.kv.get(key) || [])
      .filter(it => (it.rating?.score || 0) >= this.threshold)
      .sort((a, b) => (a.rating?.score || 0) - (b.rating?.score || 0));

    console.log('records', records);

    let codes;

    // TODO: check threshold on saved record, re-rate it as needed
    if (records.length && records[0].codes) {
      this.logger.debug(`${this} Got suitable record in KV for goals ${key}`);
      codes = records[0].codes;

    } else {
      this.logger.debug(`${this} No suitable record in KV for goals ${key}`);
      let attempts = 2;
      let success = false;
      while (!success && attempts-- > 0) {
        this.logger.debug(`${this} Write code, attempts left=${attempts}`);
        codes = await this.write(url, goals);

        for (const code of codes) {
          try {
            toFn(code);
          } catch (e) {
            this.logger.warn(`${this} The AI wrote code that did could not be turned into a function: ${e} for code ${code}`);
            continue;
          }
        }

        // TODO: for now just hard code rating since we don't do anything with it
        // TODO: retry here if below threshold
        // const rating = await this.rate(url, goal, code);
        const rating = { score: 75, analyis: 'hardcoded' };
        success = true;
        const record = { codes, rating, ai: this.ai.id };
        records.push(record);

        this.logger.debug(`${this} Save records in KV for goals ${key}`);
        await this.kv.set(key, records);
      }
    }

    this.logger.debug(`${this} Returning code for goal: ${codes.join('\n\n')}`);
    return codes.map(toFn);
  }

  async write(url, goals) {
    this.logger.debug(`${this} Write code for url=${url} goals=${goals.join('\n\n')}`);

    const codes = [];

    // Set up fetcher
    const ctx = {};
    await this.fetcher.start(ctx);
    try {
      await this.fetcher.goto(url, ctx);
      for (const goal of goals) {
        const doc = await this.fetcher.current(ctx);

        console.log('doc:' + doc);

        const context = {
          goal,
          html: pretty(doc.html, { ocd: true }),
          timeout: this.timeout,
        };

        this.logger.debug(`${this} Writing code with ${this.ai.advanced}`);
        this.logger.trace('write code');
        const { prompt } = await prompts.pageActionCode
          .renderCapped(context, 'html', this.ai.advanced);
        const answer = await this.ai.advanced.ask(prompt, { format: 'text' });
        const code = answer.partial
          .replaceAll('```javascript', '')
          .replaceAll('```', '');

        console.log('got code for goal:');
        console.log('\tgoal:', goal);
        console.log('\tcode:', code);

        // Only do each action once in write mode
        const cb = () => { console.log('write code cb'); return false };
        await exec(toFn(code), this.fetcher, ctx, cb);
        codes.push(code);
      }
      this.logger.debug(`${this} Got code: ${codes.join('\n\n')}`);
    } finally {
      this.fetcher.finish(ctx).catch((e) => {
        this.logger.error(`${this} Ignoring error on finish: ${e}`);
      });
    }

    console.log('!! Done writing code');

    return codes;
  }

  async rate(url, goal, code) {
    this.logger.debug(`${this} Rate code for goal: ${goal}`);

    const ctx = {};
    await this.fetcher.start(ctx);
    await this.fetcher.goto(url, ctx);
    const doc = await this.fetcher.current(ctx);

    let html;
    try {
      console.log('==== EXEC CODE ====');

      const fn = toFn(code);

      let result;
      await new Promise(ok => fn(
        ctx.page,
        (r) => {
          result = r;
          return false;
        },
        (msg) => {
          console.log('AI says:', msg);
        },
        ok));

      console.log('RESULT--->', result);

      throw 'STOP1111';

      // html = await new Promise(ok => {
      //   exec(fn, (results) => {
      //     console.log('GOT RESULTS', results);
      //     ok(results);
      //   }, state);
      // });
      // console.log('got results:', html);
    } catch (e) {
      this.logger.error(`${this} Error while executing code ${code}: ${e}`);
      if (process.env.STRICT_ERRORS) {
        throw e;
      }
      html = `* unable to get HTML due to execution error: ${e}`;
    }
    html ||= '* unable to get after HTML, possibly due to execution error *';

    this.fetcher.finish(ctx).catch((e) => {
      this.logger.error(`${this} Ignoring error on finish: ${e}`);
    });

    const ser = s => typeof s == 'string' ? s : JSON.stringify(s, null, 2);

    const context = {
      before: ser(state.html),
      after: ser(html),
      goal,
      code,
    }

    const { prompt } = await prompts.rateAction
      .renderCapped(context, ['before', 'after'], this.ai.advanced);
    const answer = await this.ai.advanced.ask(prompt, { format: 'json' });

    this.logger.debug(`${this} Got rating for before/after HTML: ${JSON.stringify(answer.partial)}`);

    await finish(state);

    return { state, rating: answer.partial, html };
  }
}
