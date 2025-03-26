import chalk from 'chalk';
import pTimeout from 'p-timeout';
import AsyncLock from 'async-lock';
import { logger as defaultLogger } from "../log/logger.js";
import { getFetcher } from '../fetch/index.js';
import { getAI } from '../ai/index.js';
import { getKV } from '../kv/index.js';
import { shortObjHash, createChannel, clip } from '../util.js';
import * as prompts from './prompts.js';
import { Script } from './Script.js';

let lockers = 0;
const lock = new AsyncLock();

export const Author = class {
  constructor(options) {
    this.fetcher = options?.fetcher || getFetcher();
    this.kv = options?.kv || getKV();
    this.ai = options?.ai || getAI(null, { cache: this.cache });
    this.transformers = options?.transformers || [];
    this.logger = options?.logger || defaultLogger
    this.timeout = options?.timeout || this.fetcher.timeout || 60 * 1000;
    this.wait = options?.wait || this.fetcher.wait || 4 * 1000;
    this.threshold = options?.threshold || 65;
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  async *run(task, urls) {
    const { script, output } = await this.get(task, urls);

    const seen = {};
    const hash = it => shortObjHash({ r: it.result });

    if (output) {
      seen[hash(output)] = true;
      yield Promise.resolve(output);
    }

    // TODO: process these concurrently?
    for (const url of urls) {
      const chan = createChannel();
      /* eslint-disable no-async-promise-executor */
      const promise = new Promise(async (ok) => {
        const ctx = {};
        await this.fetcher.start(ctx);
        try {
          await this.fetcher.goto(url, ctx);

          for (const [i, code] of script.codes.entries()) {
            // Only send results for last step
            let cb;
            if (i == script.codes.length - 1) {
              cb = (r) => {
                chan.send(r);
                return true;
              }
            }
            const p = exec(code, this.logger, this.fetcher, ctx, cb);
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
          continue;
        }
        seen[h] = true;
        this.logger.info(`${this} Yielding a result ${clip(val, 100)}`);
        yield Promise.resolve(val);
      }

      await promise;
    }
  }

  async lookup(task) {
    const key = task.key;
    this.logger.debug(`${this} Look up goal in kv: ${key}`);
    const records = (await this.kv.get(key) || [])
      .filter(it => (it.rating?.score || 0) >= this.threshold)
      .sort((a, b) => (a.rating?.score || 0) - (b.rating?.score || 0));
    this.logger.debug(`${this} Found ${records.length} records for ${key}`);

    let script;
    if (records.length && records[0].script) {
      this.logger.debug(`${this} Got suitable record in KV for goals ${key}`);
      script = new Script();
      script.load(records[0].script);
    }
    return { script, records };
  }

  async save(task, script) {
    const key = task.key;
    const { records } = await this.lookup(task);
    const rating = { score: 75, analyis: 'hardcoded' };
    const record = { script: script.dump(), rating, ai: this.ai.id };
    records.push(record);
    this.logger.debug(`${this} Save records in KV for goals ${key}`);
    return this.kv.set(key, records);
  }

  async get(task, urls) {
    const key = task.key;
    this.logger.debug(`${this} Get code for task: ${task}`);

    return new Promise((ok) => {
      lockers++
      this.logger.debug(`${this} Wait for lock on ${key} (count=${lockers})`);
      lock.acquire(key, async (done) => {
        try {
          let output;
          this.logger.debug(`${this} Got lock on ${key} (count=${lockers})`);

          let { script } = await this.lookup(task);

          if (!script) {
            this.logger.debug(`${this} No suitable record in KV for goals ${key}, so call write`);
            const r = await this.write(task, urls);
            script = r.script;
            output = r.output;
            await this.save(task, script);
          }

          this.logger.debug(`${this} Returning script: ${script} with code=${script.codes.join('\n\n')}`);
          lockers--;
          ok({ script, output });
        } finally {
          this.logger.debug(`${this} Release lock on ${key} (count=${lockers})`);
          done();
        }
      });
    });
  }

  async iterate() {
    throw 'TODO';
  }

  async write(task, urls, options) {
    const maxAttempts = options?.maxAttempts || 3;
    const url = urls[0]; // TODO: use all urls
    const expected = await task.expected(urls, 3);

    const script = new Script();
    let output;
    let ok = false;

    this.logger.debug(`${this} Write code for url=${url} task=${task}`);

    // Set up fetcher
    const ctx = {};
    await this.fetcher.start(ctx);

    try {
      await this.fetcher.goto(url, ctx);

      for (const goal of task.goals) {
        for (let attempt = 0; attempt <= maxAttempts; attempt++) {
          const doc = await this.fetcher.current(ctx);
          const context = {
            goal: goal,
            html: await this.transform(doc.html),
            timeout: this.timeout,
            wait: this.wait,
            expected,
          };

          this.logger.debug(`${this} Writing code with ${this.ai.advanced}, attempt=${attempt}`);
          const { prompt } = await prompts.pageActionCode
            .renderCapped(context, 'html', this.ai.advanced);

          const answer = await this.ai.advanced.ask(prompt, { format: 'text' });
          let code = answer.partial
            .replaceAll('```javascript', '')
            .replaceAll('```', '');

          this.logger.debug(`${this} Wrote code from ${this.ai.advanced} for ${task.key}: ${code}`);

          // Only do each action once in write mode
          const cb = (r) => { output = r; return false };
          try {
            await exec(code, this.logger, this.fetcher, ctx, cb);
            ok = true;
            script.push(code);
            break;
          } catch (e) {
            this.logger.warn(`${this} Caught error while executing generated code: ${e}`);
            ok = false;
          }
        }

        if (!ok) {
          this.logger.error(`${this} Made ${maxAttempts} attempts to write code for ${task} and failed, giving up`);
          return {};
        }
      }

    } finally {
      this.fetcher.finish(ctx).catch((e) => {
        this.logger.error(`${this} Ignoring error on finish: ${e}`);
      });
    }

    this.logger.info(`${this} Done writing code`);
    return { output, script };
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
        logger.debug(`${chalk.bold('[AIGEN]')} ${msg} url=${ctx.page.url()}`);
        result.messages += `${msg}\n`;
      },

      // done
      async () => {
        logger.debug(`Generated code is done`);
        ok();
      }
    )
  });

  try {
    await run;
  } catch (e) {
    console.error('Got error while execing the ai code:', e);
    throw e;
  }
  return result;
}
