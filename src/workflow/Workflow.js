import { logger } from '../log/logger.js';
import { Cursor } from '../cursor/Cursor.js';
import { Context } from '../context/Context.js';
import { Planner } from '../plan/Planner.js';
import { classMap, stepNames } from '../step/index.js';

export const Workflow = class {
  constructor() {
    this._stepsInput = [];

    this.steps = [];
    this.ctx = new Context({});
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
    const planner = new Planner(this.ctx);
    this.steps = await planner.plan(...this.steps, ...this._stepsInput);
    this._stepsInput = [];
    return this;
  }

  async run(args, cb) {
    if (args) this.parseRunArgs(args);
    await this.plan();

    if (this.steps.length == 0) return;

    const cursor = new Cursor(this.ctx, this.steps, cb);
    const last = this.steps[this.steps.length - 1];
    const rest = this.steps.slice(0, this.steps.length - 1);

    console.log('run last', last.run);
    const lastOut = await last.run(cursor, rest, this.steps.length - 1);
    console.log('lastOut', lastOut);
    return lastOut;
  }

  // async *stream(args, cb) {
  //   if (args) this.parseRunArgs(args);
  //   await this.plan();

  //   if (this.steps.length == 0) return;

  //   const cursor = new Cursor(this.ctx, this.steps, cb);

  //   let head = (async function* () {
  //     yield Promise.resolve(null);
  //   })();


  //   for (let i = 0; i < this.steps.length; i++) {
  //     head = this.steps[i].pipe(cursor, head, i);
  //   }

  //   for await (const item of head) {
  //     yield Promise.resolve({
  //       delta: item,
  //       results: cursor.results,
  //     });
  //   }
  // }
}

for (const stepName of stepNames) {
  Workflow.prototype[stepName] = function(prompt) {
    const name = stepName;
    return this.step(JSON.stringify({ name, prompt }));
  }
}
