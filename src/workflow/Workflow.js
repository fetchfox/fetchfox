import { logger } from '../log/logger.js';
import { Cursor } from '../cursor/Cursor.js';
import { Context } from '../context/Context.js';
import { Planner } from '../plan/Planner.js';
import { BaseWorkflow } from './BaseWorkflow.js';
import { isPlainObject } from '../util.js';
import { classMap, stepNames, BaseStep } from '../step/index.js';

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
    logger.info(`Workflow plan based on ${JSON.stringify(args).substr(0, 200)}`);

    if (args && args.length == 1 && args[0].prompt != undefined) {
      args = args[0];
    }

    const planner = new Planner(this.ctx);
    let planPromise

    if (args.prompt != undefined) {
      logger.debug(`Plan workflow from prompt`);
      planPromise = planner.fromPrompt(
        args.prompt,
        {
          url: args.url,
          html: args.html,
        });

    } else {
      logger.debug(`Plan workflow from string steps`);

      if (args) this.parseRunArgs(args);
      const steps = [...this.steps, ...this._stepsInput];
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

    const {
      steps,
      itemDescription,
    } = await planPromise;

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

  async run(args, cb) {
    if (args) this.parseRunArgs(args);
    await this.plan();

    if (this.steps.length == 0) return;

    this.cursor = new Cursor(this.ctx, this.steps, cb);
    const last = this.steps[this.steps.length - 1];
    const rest = this.steps.slice(0, this.steps.length - 1);

    let originalLimit = last.limit;

    try {
      if (this.ctx.limit) {
        last.limit = last.limit ? Math.min(this.ctx.limit, last.limit) : this.ctx.limit;
      }

      const msg = ` Starting workflow with ${this.steps.length} steps: ${this.steps.map(s => (''+s).replace('Step', '')).join(' -> ')} `;
      logger.info('╔' + '═'.repeat(msg.length) + '╗');
      logger.info('║' + msg + '║');
      logger.info('╚' + '═'.repeat(msg.length) + '╝');
      logger.info(`Running with global limit=${this.ctx.limit}`);

      const out = await last.run(this.cursor, this.steps, this.steps.length - 1);
      return this.cursor.out(true);

    } finally {
      last.limit = originalLimit;
      this.cursor.finishAll();
    }
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
        if (isPlainObject(args.questions) && args.questions.single === true) {
          delete args.questions.single;
          args.single = true;
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
    }

    return this.step({ name, args: prompt });
  }
}
