import { Cursor } from '../cursor/Cursor.js';
import { classMap } from '../step/index.js';

export const Workflow = class {
  constructor(data) {
    if (!data?.steps || data.steps.length == 0) return;

    let steps;
    const first = data.steps[0];
    if (typeof first.name == 'string') {
      // Assume it is JSON serializable array
      const loaded = this.load(data);
      steps = loaded.steps;
    } else {
      // Assume it is a list of classes
      steps = data.steps
    }

    this.steps = steps;
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
    const cursor = new Cursor(ctx);
    for (const step of this.steps) {
      await step.all(cursor);
    }
    return { cursor };
  }

  async *stream() {
    const cursor = new Cursor();
    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      const stream = step.stream(cursor);
      for await (const r of stream) {
        yield Promise.resolve({
          cursor,
          step,
          index: i,
          delta: r,
        });
      }
    }
  }
}
