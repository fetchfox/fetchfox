import { Cursor } from '../cursor/Cursor.js';

export const Workflow = class {
  constructor(steps) {
    this.steps = steps;
  }

  async run() {
    const cursor = new Cursor();
    for (const step of this.steps) {
      await step.full(cursor);
    }
    return cursor;
  }
}
