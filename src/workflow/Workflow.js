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

  async run(args) {
    if (args) this.parseRunArgs(args);
    await this.plan();

    const cursor = new Cursor(this.ctx);
    let index = 0;
    for (const step of this.steps) {
      cursor.index = index++;
      await step.all(cursor);
    }
    return { results: cursor.head };
  }

  async *stream(args) {
    if (args) this.parseRunArgs(args);
    await this.plan();

    const cursor = new Cursor(this.ctx);
    const results = [];
    try {
      for (let i = 0; i < this.steps.length; i++) {
        cursor.index = i;

        const step = this.steps[i];
        const stream = step.stream(cursor);
        results.push({ step: step.dump(), items: [] });

        for await (const r of stream) {
          results[i].items.push(r);

          yield Promise.resolve({
            step: { ...step, index: i },
            delta: r,
            results,
            done: false,
          });
        }
      }
    } catch(e) {
      logger.error(`Caught error during workflow: ${e}`);
      throw e;
    } finally {
      yield Promise.resolve({ results, done: true });
    }
  }
}

for (const stepName of stepNames) {
  Workflow.prototype[stepName] = function(prompt) {
    const name = stepName;
    return this.step(JSON.stringify({ name, prompt }));
  }
}
