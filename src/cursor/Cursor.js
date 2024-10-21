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
    const delta = { startedStep: stepIndex };
    if (stepIndex == this.results.length - 1) {
      delta.lastStep = true;
    }
    return this.cb && this.cb(
      {
        delta,
        results: this.results,
      },
      stepIndex);
  }

  _delta(item, stepIndex) {
    return d;
  }

  publish(item, stepIndex) {
    this.results[stepIndex].items.push(
      JSON.parse(JSON.stringify(item))
    );
    
    const delta = { item, index: stepIndex };
    if (stepIndex == this.results.length - 1) {
      delta.lastStep = true;
    }
    return this.cb && this.cb(
      {
        delta,
        results: this.results,
      },
      stepIndex);
  }

  error(message, stepIndex) {
    this.results[stepIndex].error = message;
    this.results[stepIndex].done = true;
    delete this.results[stepIndex].loading;
    const delta = { error: { index: stepIndex, message } };
    if (stepIndex == this.results.length - 1) {
      delta.lastStep = true;
    }
    return this.cb && this.cb(
      {
        delta,
        results: this.results,
      },
      stepIndex);
  }

  finish(stepIndex) {
    this.results[stepIndex].done = true;
    delete this.results[stepIndex].loading;
    const delta = { finishedStep: stepIndex };
    if (stepIndex == this.results.length - 1) {
      delta.lastStep = true;
    }
    return this.cb && this.cb(
      {
        delta,
        results: this.results
      },
      stepIndex);
  }
}
