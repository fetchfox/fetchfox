import { logger as defaultLogger } from "../log/logger.js";
import { getAI } from '../ai/index.js';
import { shortObjHash } from '../util.js';
import * as prompts from './prompts.js';

const toFn = (code) => new Function('page', 'fnSendHtml', 'fnDebugLog', 'done', code);

export const Author = class {
  constructor(kv, options) {
    this.kv = kv;
    this.ai = options?.ai || getAI(null, { cache: this.cache });
    this.logger = options?.logger || defaultLogger
    this.timeout = options?.timeout || 4000;
    this.threshold = options?.threshold || 85;
  }

  async get(namespace, goal, init, exec, finish) {
    const hash = shortObjHash({ goal });
    const key = `${namespace}-${hash}`;

    const records = (await this.kv.get(key) || [])
      .filter(it => (it.rating?.score || 0) > this.threshold)
      .sort((a, b) => (a.rating?.score || 0) - (b.rating?.score || 0));

    let code;
    if (records.length) {
      const record = records[0];
      code = record.code;
    } else {
      const r = await this.write(namespace, goal, init, finish);
      code = r.code;
      const { rating } = await this.rate(namespace, goal, code, init, exec, finish);

      // TODO: retry here if below threshold

      const record = { code, rating, ai: this.ai.id };
      records.push(record);
      await this.kv.set(key, records);
    }

    return toFn(code);
  }

  async write(namespace, goal, init, finish) {
    const state = await init();

    const context = {
      goal,
      html: state.html,
      timeout: this.timeout,
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
    const code = answer.value.partial
      .replaceAll('```javascript', '')
      .replaceAll('```', '');

    this.logger.debug(`${this} Got code for goal {goal}: ${code}`);

    await finish(state);

    return { code, state };
  }

  async rate(namespace, goal, code, init, exec, finish) {
    const state = await init();
    const fn = toFn(code);

    let html;
    try {
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
