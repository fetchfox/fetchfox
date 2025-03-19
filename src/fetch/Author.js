import { logger as defaultLogger } from "../log/logger.js";
import { getAI } from '../ai/index.js';
import { getKV } from '../kv/index.js';
import { shortObjHash } from '../util.js';
import * as prompts from './prompts.js';

const toFn = (code) => new Function('page', 'fnSendHtml', 'fnDebugLog', 'done', code);

export const Author = class {
  constructor(options) {
    this.kv = options?.kv || getKV();
    this.ai = options?.ai || getAI(null, { cache: this.cache });
    this.logger = options?.logger || defaultLogger
    this.timeout = options?.timeout || 8000;
    this.threshold = options?.threshold || 65;
  }

  toString() {
    return `[${this.constructor.name}]`;
  }

  async get(namespace, goal, init, exec, finish) {
    this.logger.debug(`${this} Get code for goal: ${goal}`);

    const hash = shortObjHash({ goal });
    const key = `${namespace}-${hash}`;

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

      const r = await this.write(namespace, goal, init, finish);
      code = r.code;
      // const { rating } = await this.rate(namespace, goal, code, init, exec, finish);
      // TODO: retry here if below threshold

      // TODO: for now just hard code rating since we don't do anything with it
      const rating = 75;

      const record = { code, rating, ai: this.ai.id };
      records.push(record);
      await this.kv.set(key, records);
    }

    this.logger.debug(`${this} Returning code for goal: ${code}`);
    return toFn(code);
  }

  async write(namespace, goal, init, finish) {
    this.logger.debug(`${this} Write code for goal: ${goal}`);

    const state = await init();

    const context = {
      goal,
      html: state.html,
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

    await finish(state);

    return { code, state };
  }

  async rate(namespace, goal, code, init, exec, finish) {
    this.logger.debug(`${this} Rate code for goal: ${goal}`);

    const state = await init();

    let html;
    try {
      const fn = toFn(code);
      html = await new Promise(ok => {
        exec(fn, ok, state);
      });
    } catch (e) {
      this.logger.error(`${this} Error while executing code ${code}: ${e}`);
      if (process.env.STRICT_ERRORS) {
        throw e;
      }
      html = `* unable to get HTML due to execution error: ${e}`;
    }
    html ||= '* unable to get after HTML, possibly due to execution error *';


    const context = {
      before: state.html,
      after: html,
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
