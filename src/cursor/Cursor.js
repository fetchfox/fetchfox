import { Context } from '../context/Context.js';

export const Cursor = class {
  constructor(args, steps, cb) {
    this.ctx = new Context(args);
    this.cb = cb ? cb : () => {};
    this.results = [];
    steps.map((step) => this.results.push({
      items: [],
      step: step.dump(),
    }));
  }

  didStart(stepIndex) {
    this.results[stepIndex].loading = true;
    this.results[stepIndex].didStart = true;
    this.results[stepIndex].done = false;
    this.cb({ results: this.results }, stepIndex);
  }

  publish(item, stepIndex) {
    this.results[stepIndex].items.push(
      JSON.parse(JSON.stringify(item))
    );
    if (this.cb) {
      this.cb({ delta: item, results: this.results }, stepIndex);
    }
  }

  error(message, stepIndex) {
    this.results[stepIndex].error = message;
    delete this.results[stepIndex].loading;
    this.cb({ results: this.results }, stepIndex);
  }

  finish(stepIndex) {
    this.results[stepIndex].done = true;
    delete this.results[stepIndex].loading;
    this.cb({ results: this.results }, stepIndex);
  }
}
