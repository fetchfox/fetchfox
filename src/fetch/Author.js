import chalk from 'chalk';
import pretty from 'pretty';
import pTimeout from 'p-timeout';
import { logger as defaultLogger } from "../log/logger.js";
import { getFetcher } from '../fetch/index.js';
import { getAI } from '../ai/index.js';
import { getKV } from '../kv/index.js';
import { shortObjHash, createChannel, clip } from '../util.js';
import * as prompts from './prompts.js';

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

  async *run(url, goals) {
    const { output, fns } = await this.get(url, goals);

    // Send the first result from write execution
    const seen = {};
    const hash = it => shortObjHash({ r: it.result });
    seen[hash(output)] = true;
    yield Promise.resolve(output);

    const chan = createChannel();
    const promise = new Promise(async (ok) => {
      const ctx = {};
      await this.fetcher.start(ctx);
      try {
        await this.fetcher.goto(url, ctx);

        for (const [i, fn] of fns.entries()) {
          // Only send results for last step
          let cb;
          if (i == fns.length - 1) {
            cb = (r) => {
              chan.send(r);
              return true;
            }
          }
          const p = exec(
            fn,
            this.logger,
            this.fetcher,
            ctx,
            cb);

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

      const h = hash(val);
      if (seen[h]) {
        continue
      }
      seen[h] = true;
      this.logger.info(`${this} Yielding a result ${clip(val, 100)}`);
      yield Promise.resolve(val);
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

    this.logger.debug(`${this} Found ${records.length} records for ${key}`);

    let codes;
    let output;

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
        const r = await this.write(url, goals);
        codes = r.codes;
        output = r.output;
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
    return { output, fns: codes.map(toFn) };
  }

  async write(url, goals) {
    this.logger.debug(`${this} Write code for url=${url} goals=${goals.join('\n\n')}`);

    let output;

    const codes = [];

    // Set up fetcher
    const ctx = {};
    await this.fetcher.start(ctx);
    try {
      await this.fetcher.goto(url, ctx);
      for (const goal of goals) {
        const doc = await this.fetcher.current(ctx);
        const context = {
          goal,
          html: await this.transform(doc.html, goal),
          timeout: this.timeout,
        };

        this.logger.debug(`${this} Writing code with ${this.ai.advanced}`);
        const { prompt } = await prompts.pageActionCode
          .renderCapped(context, 'html', this.ai.advanced);
        const answer = await this.ai.advanced.ask(prompt, { format: 'text' });
        const code = answer.partial
          .replaceAll('```javascript', '')
          .replaceAll('```', '');

        this.logger.debug(`${this} Got code from ${this.ai.advanced}: ${code}`);

        // Only do each action once in write mode
        const cb = (r) => { output = r; return false };
        await exec(
          toFn(code),
          this.logger,
          this.fetcher,
          ctx,
          cb);

        codes.push(code);
      }

    } finally {
      this.fetcher.finish(ctx).catch((e) => {
        this.logger.error(`${this} Ignoring error on finish: ${e}`);
      });
    }

    this.logger.info(`${this} Done writing code`);

    return { output, codes };
  }

  async rate(url, goals, codes) {
    this.logger.info(`${this} Rate code for goal: ${goal}`);
    throw new Error('TODO');
  }

  async transform(html, goal) {
    const tHtml = pretty(html, { ocd: true });

    // TODO

    return tHtml;
  }
}

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
const toFn = (code) => new AsyncFunction('page', 'fnSendResults', 'fnDebugLog', 'done', code);
const exec = async (fn, logger, fetcher, ctx, cb) =>  {
  const run = new Promise((ok) => {
    fn(
      ctx.page,

      // fnSendResults
      async (result) => {
        logger.debug(`AI generated code sent results: ${clip(result, 200)}`);
        await new Promise(ok => setTimeout(ok, 2000));
        if (!cb) {
          logger.debug(`No callback, always continue`);
          return true;
        }

        const doc = await fetcher.current(ctx);
        const more = await cb({ doc, result });
        if (!more) {
          logger.debug(`Callback says to stop`);
          ok();
        }
        logger.debug(`Callback says to continue`);
        return more;
      },

      // fnDebugLog
      (msg) => {
        logger.debug(`${chalk.bold('[AIGEN]')} ${msg}`);
      },

      // done
      async () => {
        logger.debug(`Generated code is done`);
        ok();
      }
    )
  });

  await run;
}
