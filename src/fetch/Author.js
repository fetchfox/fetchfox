import chalk from 'chalk';
import pTimeout from 'p-timeout';
import AsyncLock from 'async-lock';
import { logger as defaultLogger } from "../log/logger.js";
import { getFetcher } from '../fetch/index.js';
import { getAI } from '../ai/index.js';
import { getKV } from '../kv/index.js';
import { shortObjHash, createChannel, clip } from '../util.js';
import * as prompts from './prompts.js';

let lockers = 0;
const lock = new AsyncLock();

export const Author = class {
  constructor(options) {
    this.fetcher = options?.fetcher || getFetcher();
    this.kv = options?.kv || getKV();
    this.ai = options?.ai || getAI(null, { cache: this.cache });
    this.transformers = options?.transformers || [];
    this.logger = options?.logger || defaultLogger
    this.wait = options?.wait || 4000;
    this.timeout = options?.timeout || 8000;
    this.threshold = options?.threshold || 65;
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  async *run(url, goals, expected) {
    const { output, codes } = await this.get(url, goals, expected);

    // Send the first result from write execution
    const seen = {};
    const hash = it => shortObjHash({ r: it.result });

    if (output) {
      seen[hash(output)] = true;
      yield Promise.resolve(output);
    }

    const chan = createChannel();
    /* eslint-disable no-async-promise-executor */
    const promise = new Promise(async (ok) => {
      const ctx = {};
      await this.fetcher.start(ctx);
      try {
        await this.fetcher.goto(url, ctx);

        for (const [i, code] of codes.entries()) {
          // Only send results for last step
          let cb;
          if (i == codes.length - 1) {
            cb = (r) => {
              chan.send(r);
              return true;
            }
          }
          const p = exec(
            code,
            this.logger,
            this.fetcher,
            ctx,
            cb);

          try {
            await pTimeout(p, { milliseconds: 300 * 1000 });
          } catch (e) {
            this.logger.error(`${this} Exec error: ${e}`);
            throw e;
          }
        }
      } finally {
        this.fetcher.finish(ctx).catch((e) => {
          this.logger.error(`${this} Ignoring error on finish: ${e}`);
        });
        chan.end();
        ok();
      }
    });
    /* eslint-enable no-async-promise-executor */

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

  key(url, goals) {
    const domain = new URL(url).host;
    const hash = shortObjHash({ goals });
    return `author-${domain}-${hash}`;
  }

  async get(url, goals, expected) {
    this.logger.debug(`${this} Get code for goal: ${goals.join('\n')}`);
    const key = this.key(url, goals);
    const result = new Promise((ok) => {
      // lockers++
      // this.logger.debug(`${this} Wait for lock on ${key} (count=${lockers})`);
      // lock.acquire(key, async (done) => {
      const unlocked = async (done) => {
        try {
      //     this.logger.debug(`${this} Got lock on ${key} (count=${lockers})`);
      //     this.logger.debug(`${this} Look up goal in kv: ${key}`);

      //     const records = (await this.kv.get(key) || [])
      //       .filter(it => (it.rating?.score || 0) >= this.threshold)
      //       .sort((a, b) => (a.rating?.score || 0) - (b.rating?.score || 0));

      //     this.logger.debug(`${this} Found ${records.length} records for ${key}`);

      //     let codes;
      //     let output;
          const records = [];
          let codes = [];
          let confidence = 0;
          let output = '';
          // TODO: check threshold on saved record, re-rate it as needed
          if (false && records.length && records[0].codes) {
            this.logger.debug(`${this} Got suitable record in KV for goals ${key}`);
            codes = records[0].codes;

          } else {
            this.logger.debug(`${this} No suitable record in KV for goals ${key}`);
            let attempts = 1;
            let success = false;
            while (!success && attempts-- > 0) {
              this.logger.debug(`${this} Lock will be held while writing code: ${key} ${lockers}`);
              this.logger.debug(`${this} Write code, attempts left=${attempts}`);
              const r = await this.write(url, goals, expected);
              codes = r.codes;
              try {
                for (const line of codes[0].split("\n")) {
                  if (line.includes('Confidence: ')) {
                    confidence = parseInt(line.split('Confidence: ')[1]);
                    break;
                  }
                }
              } catch (e) {
                this.logger.warn(e);
                confidence = 0;
              }
              this.logger.info(`Confidence: ${confidence}`);
              if (confidence < 85) {
                break;
              }
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

              // this.logger.debug(`${this} Save records in KV for goals ${key}`);
              // await this.kv.set(key, records);
            }
          }

          this.logger.debug(`${this} Returning code for goal: ${codes.join('\n\n')}`);
          // lockers--;
          // ok({ output, fns: codes.map(toFn), codes });
          ok({ output, fns: toFn(codes[0]), codes });
        } finally {
          // this.logger.debug(`${this} Release lock on ${key} (count=${lockers})`);
          // done();
        }
      };
      return unlocked();
    });

    return result;
  }

  async iterate(url, html, goals, actual, expected) {
    const { codes } = await this.get(url, goals);
    const code = codes.join('\n\n');

    const context = {
      expected: JSON.stringify(expected, null, 2),
      actual: JSON.stringify(actual, null, 2),
      code,
      html: html,
    };
    // TODO/NOTE: This prompt is specific to items
    const { prompt } = await prompts.rateItems.renderCapped(context, 'html', this.ai.advanced);
    const answer = await this.ai.advanced.ask(prompt, { format: 'json' });
    console.log(answer);
    // throw 'STOP - author got feedback';
  }

  async write(url, goals, expected) {
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
          html: await this.transform(doc.html),
          timeout: this.timeout,
          wait: this.wait,
          expected: expected ? JSON.stringify(expected, null, 2) : '(Expected results not available)',
        };

        this.logger.debug(`${this} Writing code with ${this.ai.advanced}`);
        const { prompt } = await prompts.pageActionCode
          .renderCapped(context, 'html', this.ai.advanced);

        const answer = await this.ai.advanced.ask(prompt, { format: 'text' });
        const code = answer.partial
          .replaceAll('```javascript', '')
          .replaceAll('```', '');

        this.logger.debug(`${this} Wrote code from ${this.ai.advanced}: ${code}`);
        this.logger.trace('.');

        // Only do each action once in write mode
        const cb = (r) => { output = r; return false };
        await exec(
          code,
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

  async transform(html) {
    this.logger.debug(`${this} Running ${this.transformers.length} transformers on ${html.length} bytes`);
    let out = html;

    for (const t of this.transformers) {
      out = await t.transform(out);
    }

    this.logger.debug(`${this} Final HTML is ${out.length} bytes`);
    return out;
  }
}

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
const toFn = (code) => new AsyncFunction('page', 'fnSendResults', 'fnDebugLog', 'done', code);

const exec = async (code, logger, fetcher, ctx, cb) =>  {
  let result = {
    messages: '',
  }
  const fn = toFn(code);
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

        try {
          // In case the AI serialized it
          result = JSON.parse(result);
        } catch {
          // Ignore
        }

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
        result.messages += `${msg}\n`;
      },

      // done
      async () => {
        logger.debug(`Generated code is done`);
        ok();
      }
    )
  });

  await run;
  return result;
}
