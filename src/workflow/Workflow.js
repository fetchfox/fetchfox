import { logger } from '../log/logger.js';
import { Cursor } from '../cursor/Cursor.js';
import { Context } from '../context/Context.js';
import { Planner } from '../plan/Planner.js';
import { BaseWorkflow } from './BaseWorkflow.js';
import { isPlainObject } from '../util.js';
import { classMap, stepNames, BaseStep } from '../step/index.js';

export const Workflow = class extends BaseWorkflow {
  config(args) {
    this.ctx = new Context(args);
    return this;
  }

  async plan(...args) {
    if (args) this.parseRunArgs(args);
    const planner = new Planner(this.context());
    const steps = [...this.steps, ...this._stepsInput];
    const stepsPlain = steps.map(step => {
      if (step instanceof BaseStep) {
        return step.dump();
      } else {
        // Assume it is plain object
        return step;
      }
    });

    const results = await Promise.all([
      planner.plan(stepsPlain),
      planner.analyze({ steps: stepsPlain }),
    ]);
    this.steps = results[0];
    this.name = results[1].name;
    this.description = results[1].description;
    this._stepsInput = [];
    return this;
  }

  load(data) {
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
    try {
      if (args) this.parseRunArgs(args);
      await this.plan();

      if (this.steps.length == 0) return;
      this.cursor = new Cursor(this.context(), this.steps, cb);
      const last = this.steps[this.steps.length - 1];
      const rest = this.steps.slice(0, this.steps.length - 1);

      const out = await last.run(this.cursor, this.steps, this.steps.length - 1);

      return this.cursor.out();
    } finally {
      this.cursor.cleanup();
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
      return this.step(new cls());

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
