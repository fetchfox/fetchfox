import { setMaxListeners } from 'events';
import { Cursor } from '../cursor/Cursor.js';
import { Context } from '../context/Context.js';
import { Planner } from '../plan/Planner.js';
import { AuthorExtractor } from '../extract/index.js';
import { BaseWorkflow } from './BaseWorkflow.js';
import { isPlainObject } from '../util.js';
import { classMap, stepNames, BaseStep } from '../step/index.js';


const authorWhitelist = [
  'curaleaf',
];

export const Workflow = class extends BaseWorkflow {
  constructor() {
    super();
    this.ctx = new Context({});
  }

  config(args) {
    this.ctx.update(args);
    return this;
  }

  toString() {
    const len = (this.steps || []).length;
    return `[${this.constructor.name}: ${len} step${len == 1 ? '' : 's'}]`
  }

  async describe() {
    const planner = new Planner(this.ctx);
    const { name, description } = await planner.describe(this.dump());
    this.name = name;
    this.description = description;
    return this;
  }

  async plan(...args) {
    this.ctx.logger.info(`Workflow plan based on ${JSON.stringify(args).substr(0, 200)}`);

    if (args && args.length == 1 && args[0].prompt != undefined) {
      args = args[0];
    }

    const planner = new Planner(this.ctx);
    let planPromise

    if (args.prompt != undefined) {
      this.ctx.logger.debug(`Plan workflow from prompt`);
      planPromise = planner.fromPrompt(
        args.prompt,
        {
          url: args.url,
          html: args.html,
        });

    } else {
      if (args) this.parseRunArgs(args);
      const steps = [...this.steps, ...this._stepsInput];
      this.ctx.logger.debug(`Plan workflow from: ${JSON.stringify(steps)}`);
      const stepsPlain = steps.map(step => {
        if (step instanceof BaseStep) {
          return step.dump();
        } else {
          // Assume it is plain object
          return step;
        }
      });
      planPromise = planner.plan(stepsPlain);
    }

    const { steps } = await planPromise;

    this.steps = steps;
    this._stepsInput = [];

    return this;
  }

  load(data) {
    if (data.options) {
      this.ctx.update(data.options);
    }
    this.steps = [];
    for (const json of data.steps) {
      const cls = classMap[json.name];
      const args = Object.assign({}, json.args);
      if (!cls) {
        throw new Error(`Workflow cannot load: ${JSON.stringify(json)}`);
      }
      this.steps.push(new cls(args));
    }

    return this;
  }

  out(markDone) {
    return this.cursor.out(markDone);
  }

  useAuthor() {
    const json = JSON.stringify(this.steps);
    console.log('json', json);
    for (const wl of authorWhitelist) {
      if (json.includes(wl)) {
        return true;
      }
    }
    return false;
  }

  async run(args, cb) {
    // Create an abort controller that can cancel this worklfow,
    // and listen to the signal in context if one exists.
    this.controller = new AbortController();
    setMaxListeners(10000, this.controller.signal);

    let ctxSignal;
    let abortListener;
    if (this.ctx.signal) {
      ctxSignal = this.ctx.signal;
      this.ctx.signal = null;
      abortListener = () => {
        this.controller.abort();
      }
      ctxSignal.addEventListener('abort', abortListener);
    }
    this.ctx.update({ signal: this.controller.signal });

    if (args) this.parseRunArgs(args);
    await this.plan();

    if (this.steps.length == 0) return;

    this.cursor = new Cursor(this.ctx, this.steps, cb);
    const last = this.steps[this.steps.length - 1];

    if (this.ctx.limit) {
      for (const step of this.steps) {
        step.limit = step.limit ? Math.min(this.ctx.limit, step.limit) : this.ctx.limit;
      }
    }

    if (this.useAuthor()) {
      this.ctx.logger.debug(`${this} Using AuthorExtractor`);
      this.ctx.extractor = new AuthorExtractor({
        ...this.ctx.extractor,
        baseline: this.ctx.extractor,
      });
      this.cursor.ctx.extractor = this.ctx.extractor;
    }

    const msg = ` Starting workflow with ${this.steps.length} steps: ${this.steps.map(s => (''+s).replace('Step', '')).join(' -> ')} `;
    this.ctx.logger.info('╔' + '═'.repeat(msg.length) + '╗');
    this.ctx.logger.info('║' + msg + '║');
    this.ctx.logger.info('╚' + '═'.repeat(msg.length) + '╝');
    this.ctx.logger.info(`Running with global limit=${this.ctx.limit}`);

    try {
      await last.run(this.cursor, this.steps, this.steps.length - 1);
      return this.cursor.out(true);

    } finally {
      this.cursor.finishAll();

      if (this.controller) {
        this.controller.abort();
      }

      if (ctxSignal) {
        ctxSignal.removeEventListener('abort', abortListener);
      }
    }
  }

  abort() {
    this.ctx.logger.info(`${this} Aborting`);
    if (!this.controller) {
      this.ctx.logger.warn(`${this} Could not abort without a controller`);
      return;
    }
    this.controller.abort();
  }
}

for (const stepName of stepNames) {
  Workflow.prototype[stepName] = function(prompt) {
    const name = stepName;
    const cls = classMap[name];

    if (name == 'extract') {
      // TODO: generalize + test this
      // TODO: This is a major tech debt, FIXME
      if (prompt.questions) {
        return this.step(new cls(prompt));
      } else if (Array.isArray(prompt) || isPlainObject(prompt)) {
        const args = { questions: JSON.parse(JSON.stringify(prompt)) };

        if (isPlainObject(args.questions) && args.questions.view) {
          args.view = args.questions.view;
          delete args.questions.view;
        }

        if (isPlainObject(args.questions) && args.questions.mode) {
          args.mode = args.questions.mode;
          delete args.questions.mode;
        }

        if (isPlainObject(args.questions) && args.questions.maxPages) {
          args.maxPages = args.questions.maxPages;
          delete args.questions.maxPages;
        }

        if (isPlainObject(args.questions) && args.questions.batchSize) {
          args.batchSize = args.questions.batchSize;
          delete args.questions.batchSize;
        }

        return this.step(new cls(args));
      }

    } else if (name == 'crawl') {
      if (typeof prompt == 'string') {
        return this.step(new cls({ query: prompt }));
      }

    } else if (name == 'fetch') {
      const args = prompt;
      return this.step(new cls(args));

    } else if (name == 'limit') {
      if (prompt.limit) {
        return this.step(new cls(prompt));
      } else if (typeof prompt == 'number') {
        return this.step(new cls({ limit: prompt }));
      }
    } else if (name == 'action') {
      const args = prompt;
      return this.step(new cls(args));
    }

    return this.step({ name, args: prompt });
  }
}
