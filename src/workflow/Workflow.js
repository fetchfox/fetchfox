import { logger } from '../log/logger.js';
import { Cursor } from '../cursor/Cursor.js';
import { Context } from '../context/Context.js';
import { Planner } from '../plan/Planner.js';
import { classMap } from '../step/index.js';

export const Workflow = class {
  // constructor(args) {
  constructor() {
    // let steps = args.steps;
    // const first = steps[0];
    // if (typeof first.name == 'string') {
    //   // Assume it is JSON serializable array
    //   const loaded = this.load({ steps });
    //   steps = loaded.steps;
    // } else {
    //   // Assume it is a list of classes
    //   steps = steps
    // }
    // this.steps = steps;
    // this.config(args);
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

  async plan(...args) {
    const planner = new Planner(this.ctx);
    const steps = await planner.plan(args);
    this.steps = steps;
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

  async parseRunArgs(args) {
    if (typeof args == 'string') {
      // Treat it as a scrape prompt
      await this.plan(args);
    }
  }

  async run(args) {
    if (args) await this.parseRunArgs(args);

    const cursor = new Cursor(this.ctx);
    let index = 0;
    for (const step of this.steps) {
      cursor.index = index++;
      await step.all(cursor);
    }
    return { results: cursor.head };
  }

  async *stream(args) {
    if (args) await this.parseRunArgs(args);

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
