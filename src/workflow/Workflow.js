import { logger } from '../log/logger.js';
import { Cursor } from '../cursor/Cursor.js';
import { Context } from '../context/Context.js';
import { classMap } from '../step/index.js';

export const Workflow = class {
  constructor(args) {
    let steps = args.steps;

    const first = steps[0];
    if (typeof first.name == 'string') {
      // Assume it is JSON serializable array
      const loaded = this.load({ steps });
      steps = loaded.steps;
    } else {
      // Assume it is a list of classes
      steps = steps
    }

    this.steps = steps;
    this.ctx = new Context(args);
  }

  dump() {
    const steps = [];
    for (const step of this.steps) {
      steps.push(step.dump());
    }
    return { steps };
  }

  load(data) {
    const steps = [];
    for (const step of data.steps) {
      const cls = classMap[step.name];
      steps.push(new cls(step.args));
    }
    return { steps };
  }

  async run(ctx) {
    const cursor = new Cursor(this.ctx.update(ctx));
    let index = 0;
    for (const step of this.steps) {
      cursor.index = index++;
      await step.all(cursor);
    }
    return { cursor };
  }

  async *stream(ctx) {
    const cursor = new Cursor(this.ctx.update(ctx));

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
            index: i,
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
