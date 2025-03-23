import pretty from 'pretty';
import { logger as defaultLogger } from "../log/logger.js";
import { getFetcher } from '../fetch/index.js';
import { getAI } from '../ai/index.js';
import { getKV } from '../kv/index.js';
import { shortObjHash } from '../util.js';
import * as prompts from './prompts.js';

const toFn = (code) => new Function('page', 'fnSendResults', 'fnDebugLog', 'done', code);

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

  async get(url, goal) {
    this.logger.debug(`${this} Get code for goal: ${goal}`);

    const hash = shortObjHash({ goal });
    const key = `author-${hash}`;

    this.logger.debug(`${this} Look up goal in kv: ${key}`);

    const records = (await this.kv.get(key) || [])
      .filter(it => (it.rating?.score || 0) > this.threshold)
      .sort((a, b) => (a.rating?.score || 0) - (b.rating?.score || 0));

    let code;
    if (records.length) {
      this.logger.debug(`${this} Got suitable record in KV for ${goal}`);

      const record = records[0];
      code = record.code;

    } else {
      this.logger.debug(`${this} No suitable record in KV for ${goal}`);

      let attempts = 2;
      while (attempts-- > 0) {
        this.logger.debug(`${this} Write code, attempts left=${attempts}`);
        code = await this.write(url, goal);
        try {
          toFn(code);
        } catch (e) {
          this.logger.warn(`${this} The AI wrote code that did could not be turned into a function: ${e} for ${code}`);
          continue;
        }

        // TODO: for now just hard code rating since we don't do anything with it
        // TODO: retry here if below threshold
        // const rating = await this.rate(url, goal, code);

        const rating = 75;

        const record = { code, rating, ai: this.ai.id };
        records.push(record);
        await this.kv.set(key, records);
      }
    }

    this.logger.debug(`${this} Returning code for goal: ${code}`);
    return toFn(code);
  }

  async write(url, goal) {
    this.logger.debug(`${this} Write code for url=${url} goal=${goal}`);

    const ctx = {};
    await this.fetcher.start(ctx);
    console.log('goto url', url);
    await this.fetcher.goto(url, ctx);
    const doc = await this.fetcher.current(ctx);
    this.fetcher.finish(ctx).catch((e) => {
      this.logger.error(`${this} Ignoring error on finish: ${e}`);
    });

    const context = {
      goal,
      html: pretty(doc.html, { ocd: true }),
      timeout: this.timeout,
    };

    this.logger.debug(`${this} Writing code with ${this.ai.advanced}`);
    const { prompt } = await prompts.pageActionCode
      .renderCapped(context, 'html', this.ai.advanced);
    const answer = await this.ai.advanced.ask(prompt, { format: 'text' });
    const code = answer.partial
      .replaceAll('```javascript', '')
      .replaceAll('```', '');

    this.logger.debug(`${this} Got code for goal ${goal} =: ${code}`);

    return code;
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
