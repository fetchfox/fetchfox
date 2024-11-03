import { logger } from '../log/logger.js';
import { Cursor } from '../cursor/Cursor.js';
import { Context } from '../context/Context.js';
import { Planner } from '../plan/Planner.js';
import { BaseWorkflow } from './BaseWorkflow.js';
import { isPlainObject } from '../util.js';
import { classMap, stepNames, BaseStep } from '../step/index.js';

export const Workflow = class extends BaseWorkflow {
  config(args) {
    console.log('WF got args', args);

    this.ctx.update(args);
    // console.log('config', this.ctx);
    return this;
  }

  async plan(...args) {
    if (args && args.length == 1 && args[0].prompt) {
      args = args[0];
    }
    // console.log('args', args);
    // console.log('pppp', args.prompt);

    if (args) this.parseRunArgs(args);
    const planner = new Planner(this.context());

    let planPromise

    if (args.prompt) {
      planPromise = planner.fromPrompt(
        args.prompt,
        {
          url: args.url,
          html: args.html,
        });

    } else {
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

    const results = await Promise.all([
      planPromise,
      planner.analyze({ steps: [] }),
    ]);
    this.steps = results[0];
    this.name = results[1].name;
    this.description = results[1].description;
    this._stepsInput = [];
    return this;
  }

  load(data) {
    if (data.options) {
      this.ctx.update(data.options);
      // console.log('this.ctx->', this.ctx);
      // console.log('data.options->', data.options);
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

    console.log('context:', this.ctx);

    return this;
  }

  out(markDone) {
    return this.cursor.out(markDone);
  }

  async run(args, cb) {
    if (args) this.parseRunArgs(args);
    await this.plan();

    if (this.steps.length == 0) return;
    this.cursor = new Cursor(this.context(), this.steps, cb);
    const last = this.steps[this.steps.length - 1];
    const rest = this.steps.slice(0, this.steps.length - 1);

    let originalLimit = last.limit;
    // console.log('last', last);
    // console.log('ctx', this.ctx);

    try {
      if (this.ctx.limit) {
        console.log('set global limit', this.ctx.limit);
        last.limit = this.ctx.limit;
      }

      // console.log('last', last);

      const out = await last.run(this.cursor, this.steps, this.steps.length - 1);
      return this.cursor.out();
    } finally {
      last.limit = originalLimit;
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
