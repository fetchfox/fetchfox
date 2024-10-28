import { logger } from '../log/logger.js';
import { Cursor } from '../cursor/Cursor.js';
import { Context } from '../context/Context.js';
import { Planner } from '../plan/Planner.js';
import { BaseWorkflow } from './BaseWorkflow.js';
import { isPlainObject } from '../util.js';
import { classMap, stepNames } from '../step/index.js';

export const Workflow = class extends BaseWorkflow {
  config(args) {
    this.ctx = new Context(args);
    return this;
  }

  async plan(...args) {
    if (args) this.parseRunArgs(args);
    const planner = new Planner(this.context());
    this.steps = await planner.plan(...this.steps, ...this._stepsInput);
    this._stepsInput = [];
    return this;
  }

  async load(data) {
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

  async stop() {
    logger.info(`Stop workflow ${this}`);
    for (const step of this.steps) {
      step.stop();
    }
    return this.cursor.out();
  }

  async run(args, cb) {
    if (args) this.parseRunArgs(args);
    await this.plan();

    if (this.steps.length == 0) return;

    this.cursor = new Cursor(this.context(), this.steps, cb);
    const last = this.steps[this.steps.length - 1];
    const rest = this.steps.slice(0, this.steps.length - 1);

    await last.run(this.cursor, this.steps, this.steps.length - 1);

    return this.cursor.out();
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
      return this.step(new cls());

    } else if (name == 'limit') {
      if (prompt.limit) {
        return this.step(new cls(prompt));
      } else if (typeof prompt == 'number') {
        return this.step(new cls({ limit: prompt }));
      }
    }

    return this.step(JSON.stringify({ name, prompt }));
  }
}
