import { Context } from '../context/Context.js';

export const Cursor = class {
  constructor(args, steps) {
    this.ctx = new Context(args);
    this.results = [];
    steps.map((step) => this.results.push({
      items: [],
      step: step.dump(),
    }));
  }

  publish(stepIndex, item) {
    this.results[stepIndex].items.push(
      JSON.parse(JSON.stringify(item))
    );
  }
}
