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
