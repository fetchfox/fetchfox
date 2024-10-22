import { logger } from '../log/logger.js';
import { Cursor } from '../cursor/Cursor.js';
import { Context } from '../context/Context.js';
import { Planner } from '../plan/Planner.js';
import { classMap, stepNames } from '../step/index.js';
import { isPlainObject } from '../util.js';

export const Workflow = class {
  constructor() {
    this._stepsInput = [];
    this.steps = [];
  }

  dump() {
    const steps = [];
    for (const step of this.steps) {
      steps.push(step.dump());
    }
    return { steps };
  }

  config(args) {
    this.ctx = new Context(args);
    return this;
  }

  context() {
    if (!this.ctx) this.config({});
    return this.ctx;
  }

  load(data) {
    this.steps = [];
    for (const step of data.steps) {
      const cls = classMap[step.name];
      this.steps.push(new cls(step.args));
    }
    return this;
  }

  step(data) {
    this._stepsInput.push(data);
    return this;
  }

  init(prompt) {
    return this.step(JSON.stringify({ name: 'const', prompt }));
  }

  parseRunArgs(args) {
    if (typeof args == 'string') {
      this._stepsInput.push(args);
    } else if (Array.isArray(args)) {
      this._stepsInput = [...this._stepsInput, ...args];
    }
  }

  async plan(...args) {
    if (args) this.parseRunArgs(args);
    const planner = new Planner(this.context());
    this.steps = await planner.plan(...this.steps, ...this._stepsInput);
    this._stepsInput = [];
    return this;
  }

  async run(args, cb) {
    if (args) this.parseRunArgs(args);
    await this.plan();

    if (this.steps.length == 0) return;

    const cursor = new Cursor(this.context(), this.steps, cb);
    const last = this.steps[this.steps.length - 1];
    const rest = this.steps.slice(0, this.steps.length - 1);

    await last.run(cursor, this.steps, this.steps.length - 1);

    return cursor.results;
  }
}

for (const stepName of stepNames) {
  Workflow.prototype[stepName] = function(prompt) {
    const name = stepName;
    const cls = classMap[name];

    if (name == 'extract') {
      // TODO: generalize + test this
      if (prompt.questions) {
        return this.step(new cls(prompt));
      } else if (Array.isArray(prompt) || isPlainObject(prompt)) {
        return this.step(new cls({ questions: prompt }));
      }
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
