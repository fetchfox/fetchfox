import { Cursor } from '../cursor/Cursor.js';

export const Workflow = class {
  constructor(steps) {
    this.steps = steps;
  }

  async run() {
    const cursor = new Cursor();
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
